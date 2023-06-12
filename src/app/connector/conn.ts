export interface Ergo {
  get_utxos: (a: string, b: string) => Promise<UtxoBox[]>;
  get_change_address: () => Promise<string>;
  get_used_addresses: () => Promise<string[]>;
  get_unused_addresses: () => Promise<string[]>;
  sign_tx: (tx: string) => Promise<string>;
  submit_tx: (tx: string) => Promise<string>;
}

export interface ergoConnector {
  nautilus: {
    isConnected: () => Promise<null>;
    connect: () => Promise<null>;
    disconnect: () => Promise<null>;
  };
}

export type OptionalBlock = {
  height: number;
};

export type AddressItem = {
  amount: string;
  address: string;
};

export type Asset = {
  tokenId: string;
  amount: number;
  decimals?: number;
  name?: string;
  tokenType?: string;
};

export type Balance = {
  nanoErgs: number;
  tokens: Asset[];
};

export type dataInputsType = {
  R4?: string | Uint8Array;
  R5?: string | Uint8Array;
  R6?: string | Uint8Array;
  R7?: string | Uint8Array;
  R8?: string | Uint8Array;
  R9?: string | Uint8Array;
};

export type UtxoBoxAsset = Omit<Asset, 'amount'> & { amount: string };

export type UtxoBox = {
  boxId: string;
  value: string;
  ergoTree: string;
  assets: UtxoBoxAsset[];
  creationHeight: number;
  transactionId: string;
  index: number;
};
