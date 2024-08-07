import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Mint} from './model'
import {processor} from './processor'

processor.run(new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    const mints: Mint[] = []
    for (let c of ctx.blocks) {
        for (let tx of c.transactions) {
            // decode and normalize the tx data
            mints.push(
                new Mint({
                    id: tx.id,
                    block: c.header.height,
                    address: tx.to,
                    value: tx.value,
                    txHash: tx.hash,
                })
            )
        }
    }
    // apply vectorized transformations and aggregations
    const minted = mints.length
    const startBlock = ctx.blocks.at(0)?.header.height
    const endBlock = ctx.blocks.at(-1)?.header.height
    ctx.log.info(`Minted a total of ${minted} from ${startBlock} to ${endBlock}`)

    // upsert batches of entities with batch-optimized ctx.store.save
    await ctx.store.upsert(mints)
})
