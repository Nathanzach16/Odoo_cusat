from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal("0.01")


def money(value) -> Decimal:
    """Round to 2 decimal places the way accountants do (0.005 -> 0.01)."""
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def line_totals(quantity: int, unit_price: Decimal, tax_rate: Decimal):
    """Return (amount before tax, tax on it) for one invoice line."""
    amount = money(Decimal(quantity) * Decimal(unit_price))
    tax = money(amount * Decimal(tax_rate) / Decimal(100))
    return amount, tax