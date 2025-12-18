# Accounting Module

Comprehensive accounting module with subscription management, invoice generation, payment tracking, and expense management with approval workflows.

## Features

- **Subscription Management**: Automated billing cycles, recurring subscriptions, and subscription lifecycle management
- **Invoice Generation**: Automated invoice creation, customization, and multi-currency support
- **Payment Tracking**: Payment recording, reconciliation, and payment gateway integration
- **Expense Management**: Expense tracking with approval workflows and expense categorization
- **Multi-Currency Support**: Handle transactions in multiple currencies
- **Tax Calculations**: Automated tax calculations and tax reporting
- **Financial Reporting**: Comprehensive financial reports and analytics
- **Bank Reconciliation**: Bank statement import and reconciliation
- **Payment Gateway Integration**: Integration with popular payment gateways

## Dependencies

- **Locations Module** (required): For location-based financial operations

## Installation

The module is automatically available when installed. Ensure the Locations module is installed and activated first.

## Configuration

Configure the module through the module settings page after activation.

## Usage

1. Navigate to Accounting from the main menu
2. Access Dashboard, Subscriptions, Invoices, Payments, Expenses, or Reports submenus
3. Manage accounting operations through the respective interfaces

## Permissions

The module includes the following permissions:
- `accounting.subscription.create` - Create subscriptions
- `accounting.subscription.update` - Update subscriptions
- `accounting.subscription.delete` - Delete subscriptions
- `accounting.invoice.create` - Create invoices
- `accounting.invoice.update` - Update invoices
- `accounting.expense.create` - Create expenses
- `accounting.expense.approve` - Approve expenses
- `accounting.payment.create` - Record payments
