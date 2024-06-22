use weird::iroh::docs::Author;

fn main() {
    println!("{}", Author::new(&mut rand::thread_rng()));
}
