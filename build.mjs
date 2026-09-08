import {
    rmSync,
    mkdirSync,
    copyFileSync,
    readdirSync,
    statSync
} from "node:fs";

function copyDirectory(source, destination) {
    mkdirSync(destination, {
        recursive: true
    });

    for (const entry of readdirSync(source)) {
        const sourcePath = `${source}/${entry}`;
        const destinationPath = `${destination}/${entry}`;

        if (statSync(sourcePath).isDirectory()) {
            copyDirectory(sourcePath, destinationPath);
        } else {
            copyFileSync(sourcePath, destinationPath);
        }
    }
}

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

mkdirSync("dist/src", {
    recursive: true
});

mkdirSync("dist/img", {
    recursive: true
});

mkdirSync("dist/algorithms", {
    recursive: true
});

// Copy your website
copyFileSync("index.html", "dist/index.html");

copyDirectory("src", "dist/src");

copyDirectory("img", "dist/img");

copyDirectory("algorithms", "dist/algorithms");

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

copyDirectory(
    "node_modules/bootstrap-icons/font/fonts",
    "dist/vendor/bootstrap-icons/fonts"
);

console.log("Build completed.");