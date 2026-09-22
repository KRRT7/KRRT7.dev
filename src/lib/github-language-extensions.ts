export const githubLanguageByExtension: Record<string, string> = {
    py: "Python",
    pyx: "Cython",
    pxd: "Cython",
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    rs: "Rust",
    go: "Go",
    rb: "Ruby",
    c: "C",
    h: "C",
    cpp: "C++",
    cc: "C++",
    hpp: "C++",
    cs: "C#",
    java: "Java",
    swift: "Swift",
    kt: "Kotlin",
    scala: "Scala",
    php: "PHP",
    r: "R",
    m: "MATLAB",
    sh: "Shell",
    bash: "Shell",
    zsh: "Shell",
    ps1: "PowerShell",
    sql: "SQL",
    toml: "TOML",
    yaml: "YAML",
    yml: "YAML",
    json: "JSON",
    md: "Markdown",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    less: "LESS",
    sass: "SASS",
    vue: "Vue",
    svelte: "Svelte",
    dart: "Dart",
    lua: "Lua",
    zig: "Zig",
    tex: "LaTeX",
    dockerfile: "Dockerfile",
    tf: "HCL",
    hcl: "HCL",
    cmake: "CMake",
    mk: "Makefile",
    make: "Makefile",
    gradle: "Gradle",
    bat: "Batch",
    svg: "SVG",
    proto: "Protobuf",
};

const githubLanguageByFilename: Record<string, string> = {
    dockerfile: "Dockerfile",
    makefile: "Makefile",
};

export function githubLanguageForPath(path: string) {
    const filename = path.split("/").pop()?.toLowerCase() ?? "";
    const filenameLanguage = githubLanguageByFilename[filename];
    if (filenameLanguage) return filenameLanguage;

    const extension = filename.includes(".") ? filename.split(".").pop() ?? "" : "";
    return githubLanguageByExtension[extension];
}
