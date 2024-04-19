use std::path::{Path, PathBuf};

use clap::Arg;
use irx_config::parsers::{cmd, env, yaml};
use irx_config::ConfigBuilder;
use once_cell::sync::{Lazy, OnceCell};
use serde::Deserialize;

use tracing as trc;

mod kv;

static CONFIG: Lazy<Config> = Lazy::new(|| match parse_config() {
    Ok(config) => config,
    Err(e) => {
        eprintln!("Error loading config: {e:#?}");
        std::process::exit(1);
    }
});

struct DbConn(OnceCell<libsql::Connection>);
impl std::ops::Deref for DbConn {
    type Target = libsql::Connection;

    fn deref(&self) -> &Self::Target {
        self.0.get().expect("Database connection not initialized.")
    }
}

static DB: DbConn = DbConn(OnceCell::new());

#[derive(Deserialize, Debug, Default)]
#[serde(default)]
struct Config {
    db: DbConfig,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum DbConfig {
    Local(PathBuf),
    Remote(DbRemote),
}
impl Default for DbConfig {
    fn default() -> Self {
        DbConfig::Local("weird.db".into())
    }
}
impl std::fmt::Debug for DbConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DbConfig::Local(local) => f.write_fmt(format_args!("{local:?}")),
            DbConfig::Remote(remote) => f.write_fmt(format_args!("{:?}", remote.url)),
        }
    }
}

#[derive(Deserialize, Debug, Clone)]
pub struct DbRemote {
    pub url: String,
    pub token: String,
}

fn parse_config() -> anyhow::Result<Config> {
    let c = clap::command!()
        .arg(
            Arg::new("db:local")
                .short('f')
                .long("db-local-file")
                .env("WEIRD_DB_LOCAL"),
        )
        .arg(
            Arg::new("db:remote:url")
                .short('u')
                .long("db-remote-url")
                .conflicts_with("db:local")
                .requires("db:remote:token")
                .env("WEIRD_DB_REMOTE_URL"),
        )
        .arg(
            Arg::new("db:remote:token")
                .short('t')
                .long("db-remote-token")
                .conflicts_with("db:local")
                .requires("db:remote:url")
                .env("WEIRD_DB_REMOTE_TOKEN"),
        );
    let mut config_builder = ConfigBuilder::default()
        .append_parser(cmd::ParserBuilder::new(c).exit_on_error(true).build()?)
        .append_parser(
            env::ParserBuilder::default()
                .default_prefix("WEIRD_")
                .keys_delimiter("_")
                .build()?,
        );

    if Path::new("config.local.yaml").exists() {
        config_builder = config_builder.append_parser(
            yaml::ParserBuilder::default()
                .default_path("config.local.yaml")
                .build()?,
        );
    }
    if Path::new("config.yaml").exists() {
        config_builder = config_builder.append_parser(
            yaml::ParserBuilder::default()
                .default_path("config.yaml")
                .build()?,
        );
    }

    let config = config_builder.load()?.get()?;

    Ok(config)
}

async fn connect_to_database() -> anyhow::Result<libsql::Connection> {
    let db = match &CONFIG.db {
        DbConfig::Local(path) => libsql::Builder::new_local(path).build().await,
        DbConfig::Remote(remote) => {
            libsql::Builder::new_remote(remote.url.to_owned(), remote.token.to_owned())
                .build()
                .await
        }
    }?;

    let conn = db.connect()?;
    Ok(conn)
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();

    if let Err(e) = run().await {
        trc::error!("Error: {e:#?}");
        std::process::exit(1);
    }
}

async fn run() -> anyhow::Result<()> {
    let config = &*CONFIG;
    trc::trace!(?config);
    trc::info!("Starting Weird");

    trc::info!(?config.db, "Connecting to Database");
    let conn = connect_to_database().await?;
    DB.0.set(conn)
        .unwrap_or_else(|_| panic!("Database connection already set"));
    trc::info!("Database connection established");

    DB.execute("create table if not exists kv (key string, value text)", ())
        .await?;
    let kv = DB.query("select * from kv", ()).await;
    let kv = kv.map(|x| x.column_count());
    trc::info!(?kv);

    Ok(())
}
