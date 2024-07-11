use crate::utils::Yaml;
use weird::db::{ImportExportFormat, RawImportExportFormat};

use super::*;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router
        .route("/db/export", get(db_export))
        .route("/db/import", post(db_import))
        .route("/db/raw/export", get(db_raw_export))
        .route("/db/raw/import", post(db_raw_import))
}

/// Export database to a semi-stable [`ImportExportFormat`].
pub async fn db_export(state: State<AppState>) -> AppResult<Yaml<ImportExportFormat>> {
    Ok(Yaml(state.weird.export_db().await?))
}

/// Import database from the semi-stable [`ImportExportFormat`].
pub async fn db_import(
    state: State<AppState>,
    data: Yaml<ImportExportFormat>,
) -> AppResult<Yaml<RawImportExportFormat>> {
    // Export the data before importing it, just in case the import corrupts something.
    let export = state.weird.export_db_raw().await?;
    state.weird.import_db(data.0).await?;
    Ok(Yaml(export))
}

/// Import raw database entries from the unstable [`RawImportExportFormat`].
pub async fn db_raw_import(
    state: State<AppState>,
    data: Yaml<RawImportExportFormat>,
) -> AppResult<Yaml<RawImportExportFormat>> {
    // Export the data before importing it, just in case the import corrupts something.
    let export = state.weird.export_db_raw().await?;
    state.weird.import_db_raw(data.0).await?;
    Ok(Yaml(export))
}

/// Export raw database entries to the unstable [`RawImportExportFormat`].
pub async fn db_raw_export(state: State<AppState>) -> AppResult<Yaml<RawImportExportFormat>> {
    Ok(Yaml(state.weird.export_db_raw().await?))
}