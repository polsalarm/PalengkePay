import { Horizon, TransactionBuilder, Networks, Operation, Asset, Memo } from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const BASE_FEE = '100';

export function getServer(): Horizon.Server {
  return new Horizon.Server(HORIZON_URL);
}

export async function fetchBalance(address: string): Promise<string> {
  const server = getServer();
  const account = await server.accounts().accountId(address).call();
  const native = account.balances.find((b) => b.asset_type === 'native');
  return native ? parseFloat(native.balance).toFixed(2) : '0.00';
}

export async function buildPaymentTx(
  from: string,
  to: string,
  amount: string,
  memo?: string
): Promise<string> {
  const server = getServer();
  const account = await server.loadAccount(from);
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({
      destination: to,
      asset: Asset.native(),
      amount: parseFloat(amount).toFixed(7),
    })
  );

  if (memo) {
    builder.addMemo(Memo.text(memo.slice(0, 28)));
  }

  const tx = builder.setTimeout(30).build();
  return tx.toXDR();
}

export async function submitTx(signedXdr: string): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
  const server = getServer();
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  return server.submitTransaction(tx);
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function stellarExpertUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

export { NETWORK_PASSPHRASE };
