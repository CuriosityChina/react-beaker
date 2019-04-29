#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var program = require("commander");

var libdir = path.dirname(process.argv[1]);
var libmod =
    libdir +
    (fs.existsSync(libdir + "/node_modules/webpack") ? "/node_modules" : "/..");
var command = process.argv[2];
var context = process.argv[3] && path.resolve(process.argv[3]);

// Print version
var version = JSON.parse(fs.readFileSync(libdir + "/package.json")).version;
console.log("Version: react-beaker " + version + "\n");
program
    .version(version)
    .option("-c, --tsconfig [path]", "set tsconfig.json file path")
    .option("-p, --publicPath [path]", "set publicPath option")
    .option("-t, --reactToolkit", "build react-toolkit")
    .option("-h, --hash", "include chunkhash in output filename")
    .option("-s, --strict", "Set TypeScript strict flag to true")
    .parse(process.argv);

// Validate arguments
if (
    !command ||
    !context ||
    ["watch", "build", "publish"].indexOf(command) < 0
) {
    help();
    process.exit(1);
}

// Find all JavaScript entries
var entry = {};
var entriesDir = context + "/js/entries/";
fs.readdirSync(entriesDir).forEach(function(filename) {
    if (/.*\.sw.$/.test(filename) === false) {
        entry[filename.replace(/\.[^\.]+$/, "")] = entriesDir + filename;
    }
});

// Find all HTML files
try {
    var pages = fs.readdirSync(context + "/html").filter(function(filename) {
        return /.*\.sw.$/.test(filename) === false;
    });
} catch (_) {
    var pages = [];
}

// Choose options
var options = {};
switch (command) {
    case "watch":
        options = {
            NODE_ENV: '"development"',
            filename: "[name].min.js",
            minimize: false,
            sourceMap: true
        };
        break;
    case "build":
        options = {
            NODE_ENV: '"production"',
            filename: "[name].js",
            minimize: false,
            sourceMap: false
        };
        break;
    case "publish":
        options = {
            NODE_ENV: '"production"',
            filename: program.hash
                ? "[name].[chunkhash].min.js"
                : "[name].min.js",
            minimize: true,
            sourceMap: false
        };
        break;
}

// Generate tsconfig.json
var tsconfig = {
    compilerOptions: {
        jsx: "react",
        module: "es2015",
        allowSyntheticDefaultImports: true,
        moduleResolution: "node",
        strict: program.strict,
        target: "es5",
        lib: ["dom", "es2017"],
        experimentalDecorators: true
    }
};
var tsconfigFile = program.tsconfig && path.resolve(program.tsconfig);
if (!tsconfig || !fs.existsSync(tsconfigFile)) {
    fs.writeFileSync(
        context + "/tsconfig.json",
        JSON.stringify(tsconfig, null, 2)
    );
}

var webpack = require(libmod + "/webpack");
var HtmlWebpackPlugin = require(libmod + "/html-webpack-plugin");
var autoprefixer = require(libmod + "/autoprefixer");
var loadersForCSSFile = [
    {
        loader: "style-loader"
    },
    {
        loader: "css-loader"
    },
    {
        loader: "postcss-loader",
        options: {
            plugins: function() {
                return [
                    autoprefixer({
                        browsers: ["last 2 versions", "Safari >= 8"]
                    })
                ];
            }
        }
    }
];

var compiler = webpack({
    devtool: options.sourceMap && "inline-source-map",
    context: context,
    resolve: {
        extensions: [".web.js", ".js", ".jsx", ".ts", ".tsx"],
        alias: {
            "react/lib": libmod + "/react/lib"
        }
    },
    externals: {
        react: "React",
        redux: "Redux",
        "react-dom": "ReactDOM",
        "react-router": "ReactRouter",
        "react-addons-css-transition-group": "ReactCSSTransitionGroup"
    },
    resolveLoader: {
        modules: [libmod]
    },
    entry: entry,
    output: {
        path: context + "/dist",
        filename: options.filename,
        publicPath: program.publicPath || ""
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /^[^!]+.css$/,
                use: loadersForCSSFile
            },
            {
                test: /^[^!]+.less$/,
                use: loadersForCSSFile.concat({
                    loader: "less-loader"
                })
            }
        ]
    },
    plugins: pages
        .map(function(filename) {
            return new HtmlWebpackPlugin({
                filename: filename,
                template: context + "/html/" + filename
            });
        })
        .concat(
            options.minimize
                ? [
                      new webpack.optimize.UglifyJsPlugin({
                          sourceMap: true,
                          compress: {
                              warnings: false
                          }
                      }),
                      new webpack.LoaderOptionsPlugin({
                          minimize: true
                      })
                  ]
                : []
        )
        .concat([
            new webpack.DefinePlugin({
                "process.env": {
                    NODE_ENV: options.NODE_ENV
                }
            })
        ]),
    stats: "errors-only"
});

function buildReactCore() {
    if (!program.reactToolkit) return;
    webpack({
        context: libdir,
        entry: libdir + "/react-toolkit.js",
        output: {
            path: context + "/dist",
            filename: "react-toolkit.min.js"
        },
        plugins: [
            new webpack.optimize.UglifyJsPlugin({
                minimize: true
            }),
            new webpack.DefinePlugin({
                "process.env": {
                    NODE_ENV: '"production"'
                }
            })
        ]
    }).run(function() {});
}

function watch() {
    buildReactCore();
    compiler.watch(
        {
            poll: true
        },
        function(err, stats) {
            console.log(
                stats.toString({
                    colors: true
                })
            );
        }
    );
}

function build() {
    buildReactCore();
    compiler.run(function(err, stats) {
        console.log(
            stats.toString({
                colors: true
            })
        );
        if (stats.hasErrors()) process.exit(2);
    });
}

function help() {
    console.error("Usage:");
    console.error("  react-beaker watch   <source dir>");
    console.error("  react-beaker build   <source dir>");
    console.error("  react-beaker publish <source dir>");
}

if (command === "watch") watch();
if (command === "build") build();
if (command === "publish") build();
