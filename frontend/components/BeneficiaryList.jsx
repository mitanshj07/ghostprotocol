import { shortAddress } from "../lib/contract";

export default function BeneficiaryList({ beneficiaries = [] }) {
  return (
    <div className="stack">
      {beneficiaries.length === 0 && <p className="muted">No beneficiaries loaded.</p>}
      {beneficiaries.map((beneficiary, index) => (
        <div className="row" key={`${beneficiary.wallet}-${index}`}>
          <div>
            <strong>{beneficiary.name || `Beneficiary ${index + 1}`}</strong>
            <span>{shortAddress(beneficiary.wallet)}</span>
          </div>
          <b>{Number(beneficiary.percentage)}%</b>
        </div>
      ))}
    </div>
  );
}
