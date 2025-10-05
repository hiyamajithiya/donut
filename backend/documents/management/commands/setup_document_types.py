"""
Management command to populate database with default document types and schemas
"""
from django.core.management.base import BaseCommand
from documents.models import DocumentType


class Command(BaseCommand):
    help = 'Setup default document types with their JSON schemas'

    def handle(self, *args, **options):
        """Create default document types"""

        document_types = [
            {
                'name': 'bank_statement',
                'display_name': 'Bank Statement',
                'description': 'Bank account statements with transaction details',
                'schema': {
                    'account_number': 'string',
                    'bank_name': 'string',
                    'ifsc': 'string',
                    'period_start': 'date',
                    'period_end': 'date',
                    'opening_balance': 'number',
                    'closing_balance': 'number',
                    'transactions': [
                        {
                            'date': 'date',
                            'narration': 'string',
                            'ref_no': 'string',
                            'debit': 'number',
                            'credit': 'number',
                            'balance': 'number'
                        }
                    ]
                }
            },
            {
                'name': 'invoice',
                'display_name': 'Invoice',
                'description': 'Sales/Purchase invoices with GST details',
                'schema': {
                    'invoice_no': 'string',
                    'invoice_date': 'date',
                    'supplier_name': 'string',
                    'supplier_gstin': 'string',
                    'buyer_name': 'string',
                    'buyer_gstin': 'string',
                    'item_lines': [
                        {
                            'hsn': 'string',
                            'description': 'string',
                            'qty': 'number',
                            'rate': 'number',
                            'taxable_value': 'number',
                            'tax_rate': 'number'
                        }
                    ],
                    'totals': {
                        'taxable_amount': 'number',
                        'cgst': 'number',
                        'sgst': 'number',
                        'igst': 'number',
                        'total_tax': 'number',
                        'grand_total': 'number'
                    }
                }
            },
            {
                'name': 'expense_voucher',
                'display_name': 'Expense Voucher',
                'description': 'Expense vouchers for accounting',
                'schema': {
                    'voucher_no': 'string',
                    'date': 'date',
                    'vendor_name': 'string',
                    'ledger_name': 'string',
                    'amount': 'number',
                    'description': 'string',
                    'payment_mode': 'string'
                }
            },
            {
                'name': 'form_16',
                'display_name': 'Form 16',
                'description': 'TDS certificate for employees',
                'schema': {
                    'certificate_no': 'string',
                    'tan': 'string',
                    'deductor_name': 'string',
                    'deductor_address': 'string',
                    'pan': 'string',
                    'employee_name': 'string',
                    'assessment_year': 'string',
                    'period_from': 'date',
                    'period_to': 'date',
                    'gross_salary': 'number',
                    'total_deductions': 'number',
                    'taxable_income': 'number',
                    'income_tax': 'number',
                    'education_cess': 'number',
                    'total_tax': 'number',
                    'tds_deducted': 'number',
                    'verification_date': 'date'
                }
            },
            {
                'name': 'form_16a',
                'display_name': 'Form 16A',
                'description': 'TDS certificate for non-salary payments',
                'schema': {
                    'certificate_no': 'string',
                    'tan': 'string',
                    'deductor_name': 'string',
                    'pan': 'string',
                    'deductee_name': 'string',
                    'assessment_year': 'string',
                    'total_amount_paid': 'number',
                    'total_tax_deducted': 'number',
                    'verification_date': 'date'
                }
            },
            {
                'name': 'form_26as',
                'display_name': 'Form 26AS',
                'description': 'Annual tax statement from Income Tax Department',
                'schema': {
                    'pan': 'string',
                    'name': 'string',
                    'assessment_year': 'string',
                    'tds_details': [
                        {
                            'deductor_tan': 'string',
                            'deductor_name': 'string',
                            'amount_paid': 'number',
                            'tax_deducted': 'number',
                            'date_of_deduction': 'date'
                        }
                    ],
                    'advance_tax': 'number',
                    'self_assessment_tax': 'number',
                    'total_tax': 'number'
                }
            },
            {
                'name': 'ais_tis',
                'display_name': 'AIS/TIS',
                'description': 'Annual Information Statement / Tax Information Summary',
                'schema': {
                    'pan': 'string',
                    'name': 'string',
                    'assessment_year': 'string',
                    'salary_income': 'number',
                    'house_property_income': 'number',
                    'business_income': 'number',
                    'capital_gains': 'number',
                    'other_sources': 'number',
                    'total_income': 'number',
                    'tds_details': [
                        {
                            'deductor': 'string',
                            'amount': 'number',
                            'tds': 'number'
                        }
                    ]
                }
            },
            {
                'name': 'balance_sheet',
                'display_name': 'Balance Sheet',
                'description': 'Company balance sheet',
                'schema': {
                    'company_name': 'string',
                    'as_on_date': 'date',
                    'assets': {
                        'current_assets': {
                            'cash_and_equivalents': 'number',
                            'accounts_receivable': 'number',
                            'inventory': 'number',
                            'other_current_assets': 'number'
                        },
                        'fixed_assets': {
                            'property_plant_equipment': 'number',
                            'intangible_assets': 'number',
                            'investments': 'number'
                        }
                    },
                    'liabilities': {
                        'current_liabilities': {
                            'accounts_payable': 'number',
                            'short_term_debt': 'number',
                            'accrued_expenses': 'number'
                        },
                        'long_term_liabilities': {
                            'long_term_debt': 'number',
                            'other_liabilities': 'number'
                        }
                    },
                    'equity': {
                        'share_capital': 'number',
                        'retained_earnings': 'number',
                        'other_equity': 'number'
                    }
                }
            },
            {
                'name': 'profit_loss',
                'display_name': 'Profit & Loss Statement',
                'description': 'Company profit and loss statement',
                'schema': {
                    'company_name': 'string',
                    'period_from': 'date',
                    'period_to': 'date',
                    'revenue': {
                        'sales_revenue': 'number',
                        'other_income': 'number',
                        'total_revenue': 'number'
                    },
                    'expenses': {
                        'cost_of_goods_sold': 'number',
                        'operating_expenses': 'number',
                        'depreciation': 'number',
                        'interest_expense': 'number',
                        'other_expenses': 'number',
                        'total_expenses': 'number'
                    },
                    'profit_before_tax': 'number',
                    'tax_expense': 'number',
                    'net_profit': 'number'
                }
            }
        ]

        created_count = 0
        updated_count = 0

        for doc_type_data in document_types:
            doc_type, created = DocumentType.objects.get_or_create(
                name=doc_type_data['name'],
                defaults={
                    'display_name': doc_type_data['display_name'],
                    'description': doc_type_data['description'],
                    'schema': doc_type_data['schema']
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created document type: {doc_type.display_name}')
                )
            else:
                # Update existing
                doc_type.display_name = doc_type_data['display_name']
                doc_type.description = doc_type_data['description']
                doc_type.schema = doc_type_data['schema']
                doc_type.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated document type: {doc_type.display_name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Setup completed! Created: {created_count}, Updated: {updated_count}'
            )
        )