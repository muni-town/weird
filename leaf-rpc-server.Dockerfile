FROM messense/rust-musl-cross:x86_64-musl AS build
COPY ./ /home/rust/src
RUN --mount=type=cache,target=/home/rust/src/target \
    --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/root/.cargo/git \
    cargo build --release -p leaf-rpc-server && \
    mv /home/rust/src/target/x86_64-unknown-linux-musl/release/leaf-rpc-server /leaf-rpc-server

FROM scratch
COPY --from=build /leaf-rpc-server /leaf-rpc-server
ENTRYPOINT ["/leaf-rpc-server"]
