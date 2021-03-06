import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
    nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarketplace.json'


export default function Home() {
    const [nftaddress, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-load')

    useEffect(() => {
        loadNFTs()
    }, [])

    async function loadNFTs() {
        const provider = new ethers.providers.JsonRpcProvider()
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
        const data = await marketContract.fetchMarketItems()

        const items = await Promise.all(data.map(async i =>{
            const tokenUri = await tokenContract.tokenURI(i.tokenID)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.tostrings(), 'ether')
            let item = {
                price,
                tokenID: i.tkenID.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description,
            }
            return item
        }))
        setNfts(items)
        setLoadingState('loaded')
    }

    async function buyNft(nft) {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)

        const signer = provider.getsigner()
        const contract = new ethers.contract(nftmarketaddress,Market.abi, signer)
        
        const price = ethers.utils.parseUnits(nft.price.tostring(), 'ether')
        const transaction = await contract.createMarketSale(nftaddress, nft.tokenID, {
            value: price
        })
        await transaction.wait()
        loadNFTs()
    }

    if (loadingState === 'loaded' && !nftaddress.length) return (
        <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
    )

    return (
        <div className="flex justify-center">
            <div className="px-4" style={{ maxWidth: '1600px'}}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid:cols-4 gap-4 pt-4">
                    {
                        nftaddress.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} />
                                <div className="p-4">
                                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                                    <div style={{ height: '70px', overflow: 'hidden' }}>
                                        <p className="text-grey-400">{nft.description}</p>
                                    </div>
                                </div>
                            </div>

                        ))
                    }
                </div>    
            </div>    
        </div>
    )
}