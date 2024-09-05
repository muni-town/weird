use clap::Parser;
use iroh_base::base32;
use leaf_rpc_client::{
    leaf_protocol::prelude::{Description, Name},
    Uri,
};

// TODO: turn this into a simple CLI or maybe a repl for accessing/modifying leaf data.
#[derive(clap::Parser, Debug, Clone)]
struct Args {
    /// The URL of the Leaf server.
    pub uri: Uri,
    #[arg(short, long)]
    pub auth_token: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let secret = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        25, 26, 27, 28, 29, 30, 31,
    ];
    println!("Secret: {}", base32::fmt(secret));
    let args = Args::parse();
    let client = leaf_rpc_client::RpcClient::connect(args.uri, args.auth_token.as_deref()).await?;

    let ns = client.import_namespace_secret(secret).await?;
    let ss = client.import_subspace_secret(secret).await?;
    println!("Namespace: {}", base32::fmt(ns));
    println!("Namespace: {}", base32::fmt(ss));

    let link = (ns, ss, ["test"]);

    // client.del_components::<Name, _>(link).await?;
    // client
    //     .add_component(link, Name("Test Entity 2".into()))
    //     .await?;

    let names = client.get_components::<Name, _>(link).await?;
    dbg!(&names);
    let descriptions = client.get_components::<Description, _>(link).await?;
    dbg!(&descriptions);

    Ok(())
}
