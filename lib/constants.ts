const config = {
    algolia: {
        appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
        apiKey: process.env.NEXT_PUBLIC_ALGOLIA_API_KEY,
    },
    verticals: {
        products: {
            indexName: "fashion_society",
        },
        articles: {
            indexName: "news_paper_generic_v2",
            quickPrompts: [
                {
                    label: "influential celebrities",
                    message: "influential celebrities",
                },
                {
                    label: "What are the latest fashion trends?",
                    message: "What are the latest fashion trends?",
                },
                {
                    label: "current state of the retail industry",
                    message: "current state of the retail industry",
                },
            ]
        }
    }
}

export default config;