use weird::iroh::docs::NamespaceSecret;

fn main() {
    println!("{}", NamespaceSecret::new(&mut rand::thread_rng()));
}
