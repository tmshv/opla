import 'src/style.css'

import { AppProps } from 'next/app'
import Head from 'next/head'
// import { YMetrika } from 'src/components/YMetrika'

export default function MyApp(props: AppProps) {
    const { Component, pageProps } = props
    // const metrika = process.env.YANDEX_METRIKA

    return (
        <>
            <Head>
                <meta
                    name={'viewport'}
                    content={'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'}
                />
                {/* {!metrika ? null : (
                    <YMetrika
                        number={metrika}
                        mode={'script'}
                    />
                )} */}

                <title>Opla</title>
            </Head>

            <Component {...pageProps} />
        </>
    )
}
