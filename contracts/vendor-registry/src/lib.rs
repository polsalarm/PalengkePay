#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String,
};

// ── Data types ────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct VendorRecord {
    pub id: u64,
    pub wallet: Address,
    pub market_id: String,
    pub registered_at: u64,
    pub total_transactions: u64,
    pub total_volume: i128,
    pub is_active: bool,
}

#[contracttype]
pub enum DataKey {
    Vendor(Address),
    VendorCount,
    Admin,
}

// ── Events ────────────────────────────────────────────────────────────────────

#[contracttype]
pub struct VendorRegisteredEvent {
    pub vendor_id: u64,
    pub wallet: Address,
    pub market_id: String,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct VendorRegistry;

#[contractimpl]
impl VendorRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VendorCount, &0u64);
    }

    pub fn register_vendor(env: Env, admin: Address, wallet: Address, market_id: String) -> u64 {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        if admin != stored_admin {
            panic!("not admin");
        }

        if env.storage().persistent().has(&DataKey::Vendor(wallet.clone())) {
            panic!("vendor already registered");
        }

        let mut count: u64 = env.storage().instance().get(&DataKey::VendorCount).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::VendorCount, &count);

        let record = VendorRecord {
            id: count,
            wallet: wallet.clone(),
            market_id: market_id.clone(),
            registered_at: env.ledger().timestamp(),
            total_transactions: 0,
            total_volume: 0,
            is_active: true,
        };
        env.storage().persistent().set(&DataKey::Vendor(wallet.clone()), &record);

        env.events().publish(
            (symbol_short!("vendor"), symbol_short!("reg")),
            VendorRegisteredEvent { vendor_id: count, wallet, market_id },
        );

        count
    }

    pub fn deactivate_vendor(env: Env, admin: Address, wallet: Address) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        if admin != stored_admin {
            panic!("not admin");
        }

        let mut record: VendorRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Vendor(wallet.clone()))
            .expect("vendor not found");
        record.is_active = false;
        env.storage().persistent().set(&DataKey::Vendor(wallet), &record);
    }

    /// Called by PalengkePayment after each successful payment.
    pub fn increment_stats(env: Env, vendor: Address, amount: i128) {
        if let Some(mut record) = env
            .storage()
            .persistent()
            .get::<DataKey, VendorRecord>(&DataKey::Vendor(vendor.clone()))
        {
            record.total_transactions += 1;
            record.total_volume += amount;
            env.storage().persistent().set(&DataKey::Vendor(vendor), &record);
        }
    }

    pub fn get_vendor(env: Env, wallet: Address) -> VendorRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Vendor(wallet))
            .expect("vendor not found")
    }

    pub fn vendor_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::VendorCount).unwrap_or(0)
    }
}

mod test;
