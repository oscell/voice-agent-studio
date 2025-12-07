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
        }
    }
}

export default config;