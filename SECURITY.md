# Plasma Bug Bounty Program

## Bug Bounty Overview

This bug bounty program is specifically for [Plasma](https://github.com/Ellipsis-Labs/plasma)’s smart contract code. All relevant code is publicly available.

Our bug bounty security guidelines are based on [Immunefi’s vulnerability severity classification system](https://immunefi.com/immunefi-vulnerability-severity-classification-system-v2-2/), and are subject to change at any time.

The bug bounty program is administered by Ellipsis Labs. All bug bounty decisions made are final.

## Security Classifications and Bounty Amounts

<table>
  <tbody>
    <tr>
      <th>Severity</th>
      <th>Description</th>
      <th>Bounty</th>
    </tr>
    <tr>
      <td>Critical</td>
      <td>
        <ul>
          <li>Direct theft of funds</li>
          <li>Permanent freezing of funds</li>
          <li>Vulnerabilities that lead to protocol insolvency</li>
        </ul>
      </td>
      <td>Up to $200,000</td>
    </tr>
    <tr>
      <td>High</td>
      <td>
        <ul>
          <li>Exploits that bypass the frontrun prevention mechanism within the same leader window</li>
          <li>Temporary freezing of user funds</li>
        </ul>
      </td>
      <td>Up to $25,000</td>
    </tr>
    <tr>
      <td>Medium</td>
      <td>
        <ul>
          <li>Theft of rent</li>
          <li>Loss of data</li>
          <li>Unintended reuse of sequence numbers</li>
        </ul>
      </td>
      <td>Up to $10,000</td>
    </tr>
    <tr>
      <td>Low</td>
      <td>
        <ul>
          <li>Griefing (no profit for the attacker, but damage to the protocol or its users)</li>
          <li>Temporary denial of service</li>
        </ul>
      </td>
      <td>Up to $5,000</td>
    </tr>
  </tbody>
</table>

Bugs in `plasma-sdk` and other code outside of the smart contract will be assessed on a case-by-case basis.

## Report Submission

Please email maintainers@ellipsislabs.xyz with a detailed description of the attack vector. For high- and critical-severity reports, please include a proof of concept on a deployed fork of the relevant programs. We will reach back out within 24 hours with additional questions or next steps on the bug bounty.

## Scope

The following components are explicitly out of scope for the bounty program.

- Vulnerabilities that the reporter has already exploited themselves, leading to damage
- Any UI bugs
- Bugs in the core Solana runtime (please submit these to [Solana’s bug bounty program](https://github.com/solana-labs/solana/security/policy))
- Vulnerabilities that require a validator to execute them
- Vulnerabilities requiring access to privileged keys/credentials
- MEV vectors the team is already aware of
