use weird::iroh::docs::Author;

fn main() {
    let author = Author::new(&mut rand::thread_rng());
    println!("Private: {}", author);
    println!("Public: {}", author.id());
}
