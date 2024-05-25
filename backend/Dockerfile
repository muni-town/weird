FROM  messense/rust-musl-cross:x86_64-musl as build
COPY . /home/rust/src
RUN cargo build --release

FROM scratch
COPY --from=build /home/rust/src/target/x86_64-unknown-linux-musl/release/backend /backend
ENTRYPOINT ["/backend"]
