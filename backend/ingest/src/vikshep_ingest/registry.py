from importlib.metadata import entry_points


def discover() -> dict:
    return {ep.name: ep.load()() for ep in entry_points(group="vikshep.loaders")}


def select(path: str):
    for ld in discover().values():
        if ld.can_handle(path):
            return ld
    raise ValueError(f"no loader for {path}")
