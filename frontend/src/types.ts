export interface LoanFormData {
  // Mandatory
  loan_amnt: string
  term: string
  int_rate: string
  grade: string
  annual_inc: string
  dti: string
  revol_util: string
  purpose: string
  home_ownership: string
  verification_status: string
  // Optional
  funded_amnt: string
  funded_amnt_inv: string
  installment: string
  sub_grade: string
  emp_length: string
  pymnt_plan: string
  addr_state: string
  delinq_2yrs: string
  inq_last_6mths: string
  open_acc: string
  pub_rec: string
  revol_bal: string
  total_acc: string
  initial_list_status: string
  collections_12_mths_ex_med: string
  policy_code: string
  application_type: string
  acc_now_delinq: string
  tot_coll_amt: string
  tot_cur_bal: string
  total_rev_hi_lim: string
}

export interface ApiResponse {
  pd_default: number
  review_threshold: number
  review_flag: 0 | 1
  decline_threshold: number
  decline_flag: 0 | 1
}

export type Decision = 'Approve' | 'Review' | 'Reject'

export interface FieldDef {
  key: keyof LoanFormData
  label: string
  type: 'number' | 'select'
  options?: { value: string; label: string }[]
  step?: string
  placeholder?: string
}
