function tokenFromGhCli(): string {
    try {
        const proc = Bun.spawnSync(["gh", "auth", "token"], {
            stdout: "pipe",
            stderr: "ignore",
        });

        if (proc.exitCode !== 0) return "";
        return new TextDecoder().decode(proc.stdout).trim();
    } catch {
        return "";
    }
}

export function githubToken(): string {
    return Bun.env.GITHUB_TOKEN || tokenFromGhCli();
}
