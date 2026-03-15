import type { LoanFormData, FieldDef } from './types'

type Opt = { value: string; label: string }

function opts(values: string[]): Opt[] {
  return values.map(v => ({ value: v, label: v }))
}

const TERMS: Opt[] = [
  { value: ' 36 months', label: '36 Months' },
  { value: ' 60 months', label: '60 Months' },
]

const GRADES: Opt[] = opts(['A', 'B', 'C', 'D', 'E', 'F', 'G'])

const PURPOSES: Opt[] = [
  { value: 'debt_consolidation', label: 'Debt Consolidation' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'home_improvement', label: 'Home Improvement' },
  { value: 'major_purchase', label: 'Major Purchase' },
  { value: 'small_business', label: 'Small Business' },
  { value: 'car', label: 'Car' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'medical', label: 'Medical' },
  { value: 'moving', label: 'Moving' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'house', label: 'House' },
  { value: 'renewable_energy', label: 'Renewable Energy' },
  { value: 'other', label: 'Other' },
]

const HOME_OWNERSHIP: Opt[] = opts(['RENT', 'MORTGAGE', 'OWN', 'OTHER', 'NONE'])

const VERIFICATION_STATUS: Opt[] = opts(['Verified', 'Source Verified', 'Not Verified'])

const EMP_LENGTH: Opt[] = opts([
  '< 1 year', '1 year', '2 years', '3 years', '4 years',
  '5 years', '6 years', '7 years', '8 years', '9 years', '10+ years',
])

const SUB_GRADES: Opt[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].flatMap(g =>
  ['1', '2', '3', '4', '5'].map(n => ({ value: `${g}${n}`, label: `${g}${n}` }))
)

const US_STATES: Opt[] = opts([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
])

const PYMNT_PLAN: Opt[] = [
  { value: 'y', label: 'Yes' },
  { value: 'n', label: 'No' },
]

const INITIAL_LIST_STATUS: Opt[] = [
  { value: 'w', label: 'Whole (w)' },
  { value: 'f', label: 'Fractional (f)' },
]

const APPLICATION_TYPE: Opt[] = opts(['INDIVIDUAL', 'JOINT', 'DIRECT_PAY'])

export const MANDATORY_FIELDS: FieldDef[] = [
  { key: 'loan_amnt',          label: 'Loan Amount ($)',            type: 'number',  placeholder: 'e.g. 10000' },
  { key: 'term',               label: 'Loan Term',                  type: 'select',  options: TERMS },
  { key: 'int_rate',           label: 'Interest Rate (%)',          type: 'number',  step: '0.01', placeholder: 'e.g. 12.5' },
  { key: 'grade',              label: 'Loan Grade',                 type: 'select',  options: GRADES },
  { key: 'annual_inc',         label: 'Annual Income ($)',          type: 'number',  placeholder: 'e.g. 60000' },
  { key: 'dti',                label: 'Debt-to-Income Ratio (%)',   type: 'number',  step: '0.01', placeholder: 'e.g. 18.5' },
  { key: 'revol_util',         label: 'Revolving Utilization (%)',  type: 'number',  step: '0.01', placeholder: 'e.g. 45.2' },
  { key: 'purpose',            label: 'Loan Purpose',               type: 'select',  options: PURPOSES },
  { key: 'home_ownership',     label: 'Home Ownership',             type: 'select',  options: HOME_OWNERSHIP },
  { key: 'verification_status',label: 'Verification Status',        type: 'select',  options: VERIFICATION_STATUS },
]

export const OPTIONAL_FIELDS: FieldDef[] = [
  { key: 'funded_amnt',                label: 'Funded Amount ($)',                  type: 'number' },
  { key: 'funded_amnt_inv',            label: 'Funded Amount – Investor ($)',       type: 'number' },
  { key: 'installment',                label: 'Monthly Installment ($)',            type: 'number', step: '0.01' },
  { key: 'sub_grade',                  label: 'Sub Grade',                          type: 'select', options: SUB_GRADES },
  { key: 'emp_length',                 label: 'Employment Length',                  type: 'select', options: EMP_LENGTH },
  { key: 'pymnt_plan',                 label: 'Payment Plan',                       type: 'select', options: PYMNT_PLAN },
  { key: 'addr_state',                 label: 'State',                              type: 'select', options: US_STATES },
  { key: 'delinq_2yrs',               label: 'Delinquencies (Last 2 Years)',        type: 'number' },
  { key: 'inq_last_6mths',            label: 'Inquiries (Last 6 Months)',           type: 'number' },
  { key: 'open_acc',                   label: 'Open Accounts',                      type: 'number' },
  { key: 'pub_rec',                    label: 'Public Records',                     type: 'number' },
  { key: 'revol_bal',                  label: 'Revolving Balance ($)',              type: 'number' },
  { key: 'total_acc',                  label: 'Total Accounts',                     type: 'number' },
  { key: 'initial_list_status',        label: 'Initial List Status',                type: 'select', options: INITIAL_LIST_STATUS },
  { key: 'collections_12_mths_ex_med', label: 'Collections (Last 12 Months)',      type: 'number' },
  { key: 'policy_code',                label: 'Policy Code',                        type: 'number' },
  { key: 'application_type',           label: 'Application Type',                   type: 'select', options: APPLICATION_TYPE },
  { key: 'acc_now_delinq',             label: 'Accounts Currently Delinquent',      type: 'number' },
  { key: 'tot_coll_amt',               label: 'Total Collection Amount ($)',        type: 'number' },
  { key: 'tot_cur_bal',                label: 'Total Current Balance ($)',          type: 'number' },
  { key: 'total_rev_hi_lim',           label: 'Total Revolving High Limit ($)',     type: 'number' },
]

export const NUMERIC_FIELDS = new Set<string>([
  'loan_amnt', 'int_rate', 'annual_inc', 'dti', 'revol_util',
  'funded_amnt', 'funded_amnt_inv', 'installment', 'delinq_2yrs',
  'inq_last_6mths', 'open_acc', 'pub_rec', 'revol_bal', 'total_acc',
  'collections_12_mths_ex_med', 'policy_code', 'acc_now_delinq',
  'tot_coll_amt', 'tot_cur_bal', 'total_rev_hi_lim',
])

export const EMPTY_FORM: LoanFormData = {
  loan_amnt: '', term: '', int_rate: '', grade: '', annual_inc: '',
  dti: '', revol_util: '', purpose: '', home_ownership: '',
  verification_status: '', funded_amnt: '', funded_amnt_inv: '',
  installment: '', sub_grade: '', emp_length: '', pymnt_plan: '',
  addr_state: '', delinq_2yrs: '', inq_last_6mths: '', open_acc: '',
  pub_rec: '', revol_bal: '', total_acc: '', initial_list_status: '',
  collections_12_mths_ex_med: '', policy_code: '', application_type: '',
  acc_now_delinq: '', tot_coll_amt: '', tot_cur_bal: '', total_rev_hi_lim: '',
}

export const LOW_RISK_EXAMPLE: Partial<LoanFormData> = {
  loan_amnt: '5000',
  term: ' 36 months',
  int_rate: '6.49',
  grade: 'A',
  annual_inc: '120000',
  dti: '4.5',
  revol_util: '8.2',
  purpose: 'debt_consolidation',
  home_ownership: 'OWN',
  verification_status: 'Verified',
  funded_amnt: '5000',
  installment: '153.50',
  sub_grade: 'A1',
  emp_length: '10+ years',
  delinq_2yrs: '0',
  inq_last_6mths: '0',
  open_acc: '5',
  pub_rec: '0',
  revol_bal: '3200',
  total_acc: '12',
}

export const HIGH_RISK_EXAMPLE: Partial<LoanFormData> = {
  loan_amnt: '35000',
  term: ' 60 months',
  int_rate: '24.99',
  grade: 'F',
  annual_inc: '28000',
  dti: '38.5',
  revol_util: '91.8',
  purpose: 'small_business',
  home_ownership: 'RENT',
  verification_status: 'Not Verified',
  funded_amnt: '35000',
  installment: '1015.50',
  sub_grade: 'F4',
  emp_length: '< 1 year',
  delinq_2yrs: '3',
  inq_last_6mths: '5',
  open_acc: '15',
  pub_rec: '2',
  revol_bal: '28500',
  total_acc: '20',
}
