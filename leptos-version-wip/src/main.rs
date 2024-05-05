#[cfg(feature = "ssr")]
mod cli {
    use std::path::PathBuf;

    use clap::Parser;
    use once_cell::sync::Lazy;

    pub static ARGS: Lazy<Args> = Lazy::new(Args::parse);

    #[derive(Parser)]
    #[group(id = "db", required(true))]
    pub struct Args {
        #[arg(short = 'd', long, env("WEIRD_LOCAL_DB_PATH"), group("db"))]
        pub local_db_path: Option<PathBuf>,
        #[arg(
            short = 'u',
            long,
            env("WEIRD_REMOTE_DB_URL"),
            group("db"),
            requires("remote_db_token")
        )]
        pub remote_db_url: Option<String>,
        #[arg(short = 't', long, env("WEIRD_REMOTE_DB_TOKEN"))]
        pub remote_db_token: Option<String>,
        #[arg(short = 'A', long, env("WEIRD_REMOTE_RAUTHY_SERVER"))]
        pub rauthy_server: String,
    }
}

#[cfg(feature = "ssr")]
#[tokio::main]
async fn main() {
    use axum::extract::Request;
    use axum::response::Response;
    use axum::routing::any;
    use axum::Router;
    use http::Uri;
    use leptos::*;
    use leptos_axum::{generate_route_list, LeptosRoutes};
    use once_cell::sync::Lazy;

    use weird::app::*;
    use weird::fileserv::file_and_error_handler;

    static CLIENT: Lazy<reqwest::Client> = Lazy::new(reqwest::Client::new);
    &*cli::ARGS;

    dbg!(reqwest::get("https://hyper.rs/contrib/").await);

    async fn proxy_auth(mut req: Request) -> Result<Response, ()> {
        let path = req.uri().path();

        let uri = "https://hyper.rs/contrib/";

        dbg!(&uri);
        *req.uri_mut() = Uri::try_from(uri).unwrap();

        let r = reqwest::get("https://hyper.rs/contrib/")
            .await
            .map_err(|_| ())?;
        dbg!(r.text().await.map_err(|_| ())?);

        // let response = CLIENT
        //     .execute(
        //         CLIENT
        //             .request(req.method().clone(), dbg!(req.uri().to_string()))
        //             .build()
        //             .unwrap(),
        //     )
        //     .await
        //     .expect("TODO");

        Ok(Response::new(axum::body::Body::empty()))

        // Ok(axum::response::Response::new(axum::body::Body::from(
        //     response.bytes().await.expect("TODO"),
        // )))
    }

    // Setting get_configuration(None) means we'll be using cargo-leptos's env values
    // For deployment these variables are:
    // <https://github.com/leptos-rs/start-axum#executing-a-server-on-a-remote-machine-without-the-toolchain>
    // Alternately a file can be specified such as Some("Cargo.toml")
    // The file would need to be included with the executable when moved to deployment
    let conf = get_configuration(None).await.unwrap();
    let leptos_options = conf.leptos_options;
    let addr = leptos_options.site_addr;
    let routes = generate_route_list(App);

    // build our application with a route
    let app = Router::new()
        .route_service("/auth/*path", any(proxy_auth))
        .leptos_routes(&leptos_options, routes, App)
        .fallback(file_and_error_handler)
        .with_state(leptos_options);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    logging::log!("listening on http://{}", &addr);
    axum::serve(listener, app.into_make_service())
        .await
        .unwrap();
}

#[cfg(not(feature = "ssr"))]
pub fn main() {
    // no client-side main function
    // unless we want this to work with e.g., Trunk for a purely client-side app
    // see lib.rs for hydration function instead
}
