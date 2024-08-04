const config = {
    content: ["./src/**/*.{html,js,svelte,ts}"],

    daisyui: {
        themes: [
            {
                helius: {
                    accent: "#ea580c",

                    "base-100": "white",

                    error: "#ee2222",

                    info: "#2563eb",

                    neutral: "#616161",

                    primary: "#c7c7c7",

                    "primary-content": "#000000",

                    secondary: "#1d1d1d",

                    success: "#03B500",

                    warning: "#002D00",
                },
            },
        ],
    },

    plugins: [
        require("@tailwindcss/typography"),
        require("daisyui"),
        require("prettier-plugin-tailwindcss"),
    ],

    theme: {
        extend: {},
    },
};

module.exports = config;
