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

fn register(env: &Env, client: &VendorRegistryClient, admin: &Address, wallet: &Address) -> u64 {
    client.register_vendor(
        admin,
        wallet,
        &String::from_str(env, "marikina-public-market"),
        &String::from_str(env, "Aling Nena"),
        &String::from_str(env, "B-14"),
        &String::from_str(env, "+639171234567"),
        &String::from_str(env, "fish"),
    )
}

#[test]
fn test_register_vendor() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);

    let vendor_id = register(&env, &client, &admin, &vendor);
    assert_eq!(vendor_id, 1);
    assert_eq!(client.vendor_count(), 1);
}

#[test]
fn test_get_vendor() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);

    register(&env, &client, &admin, &vendor);
    let record = client.get_vendor(&vendor);

    assert_eq!(record.wallet, vendor);
    assert_eq!(record.name, String::from_str(&env, "Aling Nena"));
    assert_eq!(record.stall_number, String::from_str(&env, "B-14"));
    assert_eq!(record.product_type, String::from_str(&env, "fish"));
    assert!(record.is_active);
    assert_eq!(record.total_transactions, 0);
    assert_eq!(record.total_volume, 0);
}

#[test]
fn test_update_profile() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);

    register(&env, &client, &admin, &vendor);
    client.update_profile(
        &vendor,
        &String::from_str(&env, "Mang Ben"),
        &String::from_str(&env, "C-22"),
        &String::from_str(&env, "+639187654321"),
        &String::from_str(&env, "meat"),
    );

    let record = client.get_vendor(&vendor);
    assert_eq!(record.name, String::from_str(&env, "Mang Ben"));
    assert_eq!(record.stall_number, String::from_str(&env, "C-22"));
    assert_eq!(record.product_type, String::from_str(&env, "meat"));
}

#[test]
#[should_panic(expected = "vendor already registered")]
fn test_duplicate_registration_panics() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);

    register(&env, &client, &admin, &vendor);
    register(&env, &client, &admin, &vendor);
}

#[test]
fn test_deactivate_vendor() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);

    register(&env, &client, &admin, &vendor);
    client.deactivate_vendor(&admin, &vendor);

    let record = client.get_vendor(&vendor);
    assert!(!record.is_active);
}

#[test]
fn test_increment_stats() {
    let (env, admin, client) = setup();
    let vendor = Address::generate(&env);

    register(&env, &client, &admin, &vendor);
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

    register(&env, &client, &not_admin, &vendor);
}
