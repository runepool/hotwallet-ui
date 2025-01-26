import { CreateRuneOrderDto, RuneOrder, CreateBatchRuneOrderDto, TokenBalance } from '../types/api';
import { getApiClient } from '../services/api-provider';

export async function createOrder(order: CreateRuneOrderDto): Promise<void> {
  return getApiClient().createOrder(order);
}

export async function getOrders(): Promise<RuneOrder[]> {
  return getApiClient().getOrders();
}

export async function getOrderById(orderId: string): Promise<RuneOrder> {
  return getApiClient().getOrderById(orderId);
}

export async function createBatchOrders(orders: CreateBatchRuneOrderDto): Promise<void> {
  return getApiClient().createBatchOrders(orders);
}

export async function getTokenBalances(): Promise<TokenBalance[]> {
  return getApiClient().getTokenBalances();
}

export async function deleteOrder(orderId: string): Promise<void> {
  return getApiClient().deleteOrder(orderId);
}