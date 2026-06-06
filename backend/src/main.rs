use std::os::unix::process::CommandExt;

fn main() {
    let bin = resolve_mcp_bin();

    #[cfg(target_os = "linux")]
    check_shm_dir();

    eprintln!("[vikshep-backend] exec → {bin}");

    // Replace this process with omnipulse-mcp, forwarding all arguments.
    let err = std::process::Command::new(&bin)
        .args(std::env::args().skip(1))
        .exec();

    eprintln!("[vikshep-backend] failed to exec '{bin}': {err}");
    std::process::exit(1);
}

// Resolution order (no machine-specific fallback):
//   1. $OMNIPULSE_MCP_BIN env var
//   2. PATH lookup for "omnipulse-mcp"
//   3. Fatal error with install instructions
fn resolve_mcp_bin() -> String {
    if let Ok(v) = std::env::var("OMNIPULSE_MCP_BIN") {
        return v;
    }
    if let Ok(path) = which_bin("omnipulse-mcp") {
        return path;
    }
    eprintln!(
        "[vikshep-backend] error: omnipulse-mcp not found.\n\
         Install it via cargo:  cargo install omnipulse-mcp\n\
         Or set the env var:    export OMNIPULSE_MCP_BIN=/path/to/omnipulse-mcp"
    );
    std::process::exit(1);
}

fn which_bin(name: &str) -> Result<String, ()> {
    let output = std::process::Command::new("which")
        .arg(name)
        .output()
        .map_err(|_| ())?;
    if output.status.success() {
        let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !s.is_empty() { return Ok(s); }
    }
    Err(())
}

#[cfg(target_os = "linux")]
fn check_shm_dir() {
    use std::os::unix::fs::PermissionsExt;
    let shm = std::path::Path::new("/dev/shm");
    if !shm.exists() {
        eprintln!("[vikshep-backend] warning: /dev/shm does not exist");
        return;
    }
    if let Ok(meta) = shm.metadata() {
        let mode = meta.permissions().mode() & 0o777;
        if mode & 0o022 == 0 {
            eprintln!("[vikshep-backend] warning: /dev/shm not world-writable (mode {mode:03o})");
        }
    }
}
