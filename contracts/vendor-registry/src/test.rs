#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (Env, Address, VendorRegistryClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, VendorRegistry);
    let client = VendorRegistryClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, admin, client)
}

#[test]
fn test_register_vendor() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);
    let market_id = String::from_str(&env, "marikina-public-market");

    let vendor_id = client.register_vendor(&admin, &vendor, &market_id);
    assert_eq!(vendor_id, 1);
    assert_eq!(client.vendor_count(), 1);
}

#[test]
fn test_get_vendor() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);
    let market_id = String::from_str(&env, "marikina-public-market");

    client.register_vendor(&admin, &vendor, &market_id);
    let record = client.get_vendor(&vendor);

    assert_eq!(record.wallet, vendor);
    assert!(record.is_active);
    assert_eq!(record.total_transactions, 0);
    assert_eq!(record.total_volume, 0);
}

#[test]
#[should_panic(expected = "vendor already registered")]
fn test_duplicate_registration_panics() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);
    let market_id = String::from_str(&env, "market-1");

    client.register_vendor(&admin, &vendor, &market_id);
    client.register_vendor(&admin, &vendor, &market_id); // should panic
}

#[test]
fn test_deactivate_vendor() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);
    let market_id = String::from_str(&env, "market-1");

    client.register_vendor(&admin, &vendor, &market_id);
    client.deactivate_vendor(&admin, &vendor);

    let record = client.get_vendor(&vendor);
    assert!(!record.is_active);
}

#[test]
fn test_increment_stats() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);
    let market_id = String::from_str(&env, "market-1");

    client.register_vendor(&admin, &vendor, &market_id);
    client.increment_stats(&vendor, &10_000_000i128);
    client.increment_stats(&vendor, &5_000_000i128);

    let record = client.get_vendor(&vendor);
    assert_eq!(record.total_transactions, 2);
    assert_eq!(record.total_volume, 15_000_000i128);
}

#[test]
#[should_panic(expected = "not admin")]
fn test_non_admin_cannot_register() {
    let (env, _, client) = setup();
    let not_admin = Address::generate(&env);
    let vendor = Address::generate(&env);
    let market_id = String::from_str(&env, "market-1");

    client.register_vendor(&not_admin, &vendor, &market_id);
}
