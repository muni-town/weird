use std::path::PathBuf;

use clap::Arg;
use irx_config::parsers::{cmd, env, yaml};
use irx_config::ConfigBuilder;
use once_cell::sync::Lazy;
use serde::Deserialize;

use tracing as trc;

static CONFIG: Lazy<Config> = Lazy::new(|| match parse_config() {
    Ok(config) => config,
    Err(e) => {
        eprintln!("Error: {e:#?}");
        std::process::exit(1);
    }
});

#[derive(Deserialize, Debug, Default)]
#[serde(default)]
struct Config {
    db: DbConfig,
}

#[derive(Deserialize, Debug, Clone)]
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
    let config: Config = ConfigBuilder::default()
        .append_parser(cmd::ParserBuilder::new(c).exit_on_error(true).build()?)
        .append_parser(
            env::ParserBuilder::default()
                .default_prefix("WEIRD_")
                .keys_delimiter("_")
                .build()?,
        )
        .append_parser(
            yaml::ParserBuilder::default()
                .default_path("config.yaml")
                .build()?,
        )
        .load()?
        .get()?;

    Ok(config)
}

#[async_std::main]
async fn main() {
    tracing_subscriber::fmt().init();

    if let Err(e) = run().await {
        trc::error!("Error: {e:#?}");
        std::process::exit(1);
    }
}

async fn run() -> anyhow::Result<()> {
    let config = &*CONFIG;
    trc::info!(?config, "Starting Weird");
    Ok(())
}
