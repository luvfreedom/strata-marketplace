import { Box, Center } from "@chakra-ui/react";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Provider } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { usePublicKey } from "@strata-foundation/react";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { getImageFromMeta, SplTokenMetadata } from "@strata-foundation/spl-utils";
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { useRouter } from 'next/router';
import React from "react";
import { MarketplaceItem } from "@/components/MarketplaceItem";
import { DEFAULT_ENDPOINT } from "@/components/Wallet";

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  global.localStorage = new LocalStorage('./scratch');
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  console.log("Fetching metadata...");
  const connection = new Connection(DEFAULT_ENDPOINT);
  const provider = new Provider(connection, new NodeWallet(Keypair.generate()), {})
  const tokenBondingSdk = await SplTokenBonding.init(provider);
  const tokenBondingAcct = (await tokenBondingSdk.getTokenBonding(new PublicKey(context.params?.tokenBondingKey as string)));
  if (!tokenBondingAcct) {
    console.log("Not found", context.params?.tokenBondingKey);
    return {
      notFound: true
    }
  }
  const tokenMetadataSdk = await SplTokenMetadata.init(provider);
  const metadataAcc = (await tokenMetadataSdk.getMetadata(await Metadata.getPDA(tokenBondingAcct.targetMint)));
  const metadata = await SplTokenMetadata.getArweaveMetadata(metadataAcc?.data.uri);

  return {
    notFound: false,
    props: {
      name: metadataAcc?.data.name,
      description: metadata?.description,
      image: getImageFromMeta(metadata),
    }
  }
}


export const MarketDisplay: NextPage = ({ name, image, description }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter()
  const { tokenBondingKey: tokenBondingKeyRaw } = router.query;
  const tokenBondingKey = usePublicKey(tokenBondingKeyRaw as string);

  return <Box h="100vh">
    <Head>
      <title>{name}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={name} />
      <meta property="og:image" content={image} />
      <meta property="og:description" content={description} />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <Box w="full" h="full" overflow="auto" paddingTop={{ sm: "18px" }}>
      <Center flexGrow={1}>
        <Center bg="white" shadow="xl" rounded="lg" w="420px">
          <MarketplaceItem 
            name={name}
            description={description}
            image={image}
            tokenBondingKey={tokenBondingKey}
          />
        </Center>
      </Center>
    </Box>
  </Box>
}

export default MarketDisplay;