use leaf_protocol::{components::Name, Component};

/// This is really just a test example to sanity check or view component hashes during development.
#[tokio::main]
pub async fn main() -> anyhow::Result<()> {
    println!("Name Schema ID: {}", Name::schema_id());
    println!("Name Schema ID: {:?}", Name::schema_id().as_bytes());
    Ok(())
}
