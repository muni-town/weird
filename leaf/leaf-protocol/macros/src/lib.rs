use std::{path::PathBuf, str::FromStr};

use borsh::BorshSerialize;
use iroh_base::hash::Hash;
use leaf_protocol_types::*;
use proc_macro::TokenStream;
use quote::{format_ident, quote, quote_spanned, spanned::Spanned};
use unsynn::{Parse, TokenTree};

/// Helper macro to bail out of the macro with a compile error.
macro_rules! throw {
    ($hasSpan:expr, $err:literal) => {
        let span = $hasSpan.__span();
        return quote_spanned!(span =>
            compile_error!($err);
        ).into();
    };
}

type KeyValueAttribute = unsynn::Cons<
    unsynn::Ident,
    Option<
        unsynn::Cons<
            unsynn::Assign,
            unsynn::Either<unsynn::LiteralString, unsynn::PathSepDelimitedVec<unsynn::Ident>>,
        >,
    >,
>;

/// Derive macro for the `Component` trait.
///
/// ```ignore
/// #[derive(BorshSerialize, BorshDeserialize, HasBorshSchema, Component)]
/// #[component(
///     specification = "examples/schemas/ExampleData",
///     schema_id = "ehlbg4aesvav6x4wt4bcdocci323a5cb2jnhyhiizj3qmbaqkk4a"
/// )]
/// struct ExampleData {
///     name: String,
///     age: u8,
///     tags: Vec<String>,
/// }
/// ```
///
/// The attribute options for the `#[component()]` attribute are:
///
/// - `name = "ComponentName"` - Allows you to set the component name in the schema.
/// - `schema_id = "ehlbg4aesvav6x4wt4bcdocci323a5cb2jnhyhiizj3qmbaqkk4a"` - Lets you add an
///   assertion that the resulting schema digest matches the expected value.
/// - `specification = "path/to/schema"` - Lets you specify the path to a directory containing the
///   specification components.
///
/// ## Specification
///
/// The specification is made up of a list of components. The specification directory must contain 1
/// file for each component you want to add to the specification.
///
/// The name of each component must contain the base32 encoded schema ID of the component. It may
/// optionally be prefixed with an identifier ending with an underscore ( `_` ) before the schema
/// ID. It may optionally be suffixed with a `.` and a file extension that will be ignored.
///
/// The macro will ignore any file in the directory starting with a `.` or with `README`.
///
/// The contents of each component file must be in the Borsh format associated to the component's
/// schema ID.
#[proc_macro_derive(Component, attributes(component))]
pub fn derive_component(input: TokenStream) -> TokenStream {
    let input = venial::parse_item(input.into()).unwrap();

    let mut attr_name: Option<String> = None;
    let mut attr_schema_id: Option<String> = None;
    let mut attr_no_check_schema_id = false;
    let mut attr_no_compute_schema_id = false;
    let mut attr_specification: Option<String> = None;

    for attr in input.attributes() {
        if attr.path.len() != 1 {
            continue;
        }
        let TokenTree::Ident(name) = &attr.path[0] else {
            continue;
        };
        if name != &format_ident!("component") {
            continue;
        }

        let mut value =
            unsynn::TokenStream::from_iter(attr.value.get_value_tokens().iter().cloned())
                .into_iter();
        let Ok(key_value_attributes) =
            unsynn::CommaDelimitedVec::<KeyValueAttribute>::parse(&mut value)
        else {
            throw!(attr.value, "Cannot parse attribute");
        };

        let mut ids = Vec::new();
        for key_value in key_value_attributes.0 {
            let key_value = key_value.value;
            let ident = key_value.first;
            let eq_value = key_value.second;

            ids.push(ident.clone());

            if ident == format_ident!("name") {
                if let Some(eq_value) = eq_value {
                    if let unsynn::Either::First(n) = eq_value.second {
                        attr_name = Some(n.as_str().into());
                    } else {
                        throw!(ident, "name should be a string.");
                    }
                } else {
                    throw!(ident, "name requires a value");
                }
            } else if ident == format_ident!("specification") {
                if let Some(eq_value) = eq_value {
                    if let unsynn::Either::First(s) = eq_value.second {
                        attr_specification = Some(s.as_str().into());
                    } else {
                        throw!(ident, "specification should be a string.");
                    }
                } else {
                    throw!(ident, "specification needs a value.");
                }
            } else if ident == "schema_id" {
                if let Some(eq_value) = eq_value {
                    if let unsynn::Either::First(s) = eq_value.second {
                        attr_schema_id = Some(s.as_str().into());
                    } else {
                        throw!(ident, "schema_id should be a string.");
                    }
                } else {
                    throw!(ident, "schema_id needs a value.");
                }
            } else if ident == "no_check_schema_id" {
                if eq_value.is_none() {
                    attr_no_check_schema_id = true;
                } else {
                    throw!(ident, "no_check_schema_id takes no value");
                }
            } else if ident == "no_compute_schema_id" {
                if eq_value.is_none() {
                    attr_no_compute_schema_id = true;
                } else {
                    throw!(ident, "no_compute_schema_id takes no value");
                }
            } else {
                throw!(ident, "unrecognized setting");
            }
        }
    }

    let name = input.name();
    let component_name = if let Some(component_name) = attr_name {
        component_name
    } else {
        name.clone().unwrap().to_string()
    };

    let mut spec_files = Vec::new();
    if let Some(specification) = &attr_specification {
        let cargo_workspace_dir = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
        let specification_dir = cargo_workspace_dir.join(specification);
        let specification_dir_read = std::fs::read_dir(specification_dir).unwrap();
        for entry in specification_dir_read {
            let entry = entry.unwrap();
            let filename = entry.file_name().into_string().unwrap();
            if entry.file_type().unwrap().is_file()
                && !filename.starts_with('.')
                && !filename.starts_with("README")
            {
                spec_files.push(entry.path());
            }
        }
    }

    let expected_schema_id = attr_schema_id.map(|x| Digest(Hash::from_str(&x).unwrap()));
    let schema_id = if !attr_no_compute_schema_id {
        let spec_hash: Digest = {
            let components = spec_files
                .into_iter()
                .map(|path| {
                    let schema_id_str = path.file_name().unwrap().to_str().unwrap();
                    let schema_id_str = if let Some((_prefix, id)) = schema_id_str.rsplit_once('_')
                    {
                        if let Some((id, _suffix)) = id.split_once('.') {
                            id
                        } else {
                            id
                        }
                    } else {
                        schema_id_str
                    };
                    let schema_id = Digest(Hash::from_str(schema_id_str).unwrap());
                    let mut buf = Vec::new();
                    let data = std::fs::read(&path).unwrap();
                    ComponentKind::Unencrypted(ComponentData {
                        schema: schema_id,
                        data,
                    })
                    .serialize(&mut buf)
                    .unwrap();
                    let component_id = Digest(Hash::from(iroh_blake3::hash(&buf)));

                    ComponentEntry {
                        schema_id: Some(schema_id),
                        component_id,
                    }
                })
                .collect::<Vec<_>>();
            let mut entity = Entity { components };
            entity.sort_components();
            entity.compute_digest()
        };

        let mut schema_bytes = Vec::new();
        (&component_name, spec_hash)
            .serialize(&mut schema_bytes)
            .unwrap();

        Digest::new(&schema_bytes)
    } else if let Some(expected) = expected_schema_id {
        expected
    } else {
        throw!(
            name,
            "You must either provide a schema ID with a `no_compute_schema_id` flag,\
            or add a `no_check_schema_id` and allow it to be computed"
        );
    };
    let schema_id_bytes = *schema_id.0.as_bytes();

    if !attr_no_check_schema_id && !attr_no_compute_schema_id {
        let expected = expected_schema_id.unwrap();
        if schema_id != expected {
            panic!(
                "Computed schema ID does not match expected:\
                \ncomputed:{schema_id}\nexpected:{expected}"
            )
        }
    }

    quote! {
        impl Component for #name {
            fn schema_id() -> Digest {
                Digest::from_bytes([#(#schema_id_bytes),*])
            }
        }
    }
    .into()
}

/// Derive macro fro the `HasBorshSchema` trait.
///
/// [`HasBorshSchema`] is required to implement [`Component`], and returns the borsh schema for the
/// Rust type that can be used for the component specification.
#[proc_macro_derive(HasBorshSchema)]
pub fn derive_has_borsh_schema(input: TokenStream) -> TokenStream {
    let input = venial::parse_item(input.into()).unwrap();

    let Some(name) = input.name() else {
        throw!(input, "Missing struct/enum name.");
    };

    fn fields_schema_expr(fields: &venial::Fields) -> proc_macro2::TokenStream {
        match fields {
            venial::Fields::Unit => {
                quote! {
                    BorshSchema::Null
                }
            }
            venial::Fields::Tuple(fields) => {
                if fields.fields.len() != 1 {
                    throw!(
                        fields,
                        "Only tuples with one field may be used in BorshSchemas, \
                        and the type of the field in the schema will \
                        be that of the inner type in that case."
                    );
                }
                let (field, _punct) = &fields.fields[0];
                let ty = &field.ty;
                quote! { <#ty>::borsh_schema() }
            }
            venial::Fields::Named(fields) => {
                let mut field_exprs = Vec::new();
                for field in fields.fields.items() {
                    let name = &field.name;
                    let ty = &field.ty;
                    field_exprs.push(quote! {
                       (stringify!(#name).to_string(), <#ty>::borsh_schema())
                    });
                }
                quote! { BorshSchema::Struct { fields: vec![#(#field_exprs),*] } }
            }
        }
    }

    let schema_expr = match input {
        venial::Item::Struct(s) => fields_schema_expr(&s.fields),
        venial::Item::Enum(e) => {
            let mut variant_exprs = Vec::new();
            for variant in e.variants.items() {
                let name = &variant.name;
                let fields_schema = fields_schema_expr(&variant.fields);
                variant_exprs.push(quote! { ( stringify!(#name).to_string(), #fields_schema) });
            }
            quote! { BorshSchema::Enum { variants: vec![#(#variant_exprs),*] } }
        }
        _ => {
            throw!(
                name,
                "You may only derive HasBorshSchema on Structs, and Enums"
            );
        }
    };

    quote! {
        impl HasBorshSchema for #name {
            fn borsh_schema() -> BorshSchema {
                #schema_expr
            }
        }
    }
    .into()
}
