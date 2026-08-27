import {
    rmSync,
    mkdirSync,
    cpSync,
    copyFileSync
} from "node:fs";

// Delete old build
rmSync("dist", {
    recursive: true,
    force: true
});

// Create directories
mkdirSync("dist", {
    recursive: true
});

mkdirSync("dist/vendor/bootstrap", {
    recursive: true
});

mkdirSync("dist/vendor/bootstrap-icons/fonts", {
    recursive: true
});

// Copy your website
copyFileSync("index.html", "dist/index.html");

cpSync("src", "dist/src", {
    recursive: true
});

cpSync("img", "dist/img", {
    recursive: true
});

cpSync("algorithms", "dist/algorithms", {
    recursive: true
});

copyFileSync("main.py", "dist/main.py");

// Copy Bootstrap from node_modules
copyFileSync(
    "node_modules/bootstrap/dist/css/bootstrap.min.css",
    "dist/vendor/bootstrap/bootstrap.min.css"
);

copyFileSync(
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
    "dist/vendor/bootstrap/bootstrap.bundle.min.js"
);

// Copy Bootstrap Icons from node_modules
copyFileSync(
    "node_modules/bootstrap-icons/font/bootstrap-icons.min.css",
    "dist/vendor/bootstrap-icons/bootstrap-icons.min.css"
);

cpSync(
    "node_modules/bootstrap-icons/font/fonts",
    "dist/vendor/bootstrap-icons/fonts",
    {
        recursive: true
    }
);

console.log("Build completed.");