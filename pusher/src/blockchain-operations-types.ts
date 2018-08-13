export interface Block {
    block_id: string;
    previous: string;
    timestamp: string;
    transactions: Transaction [];
    [x: string]: any; // allows other properties
}

export interface Transaction {
    ref_block_num: number;
    transaction_id: string;
    operations: [string, object] [];
    [x: string]: any; // allows other properties
}

export interface Operation {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    operation_num: number;
    timestamp: Date;
    op: [string, object];
}

export type CustomJsonOperation = {
    id: string;
    json: string;
    required_auths: string [];
    required_posting_auths: string [];
};

export interface VoteOperation {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
}

export interface SteemPost {
    id: number;
    author: string;
    permlink: string;
    category: string;
    title: string;
    body: string;
    json_metadata: string;
    last_update: string;
    created: string;
    active: string;
    last_payout: string;
    [x: string]: any; // allows other properties
}

export interface SteemPostJSONMetadata {
    tags: string [];
    [x: string]: any; // allows other properties
}
// TODO move to "/blockchain"