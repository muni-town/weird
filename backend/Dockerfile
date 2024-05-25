FROM  messense/rust-musl-cross:x86_64-musl as build
COPY . /home/rust/src
RUN --mount=type=cache,target=/home/rust/src/target \
    --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/root/.cargo/git \
    cargo build --release

FROM scratch
COPY --from=build /home/rust/src/target/x86_64-unknown-linux-musl/release/backend /backend
ENTRYPOINT ["/backend"]
