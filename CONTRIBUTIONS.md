# Contrbutions
Eclipse XRAY has 3 ways for community members to contribute: Adding dApps, Labeling Programs, and Writing Code. 

## Adding dApps
dApps can be added to `src/config/dapps.json` in the following format:
```
    {
        "name": "My dApp",
        "description": "A description or tagline about the dapp",
        "icon": "/media/dapps/mydapp.jpg",
        "link": "https://my-dapp.com/",
        "network": "mainnet"
    }
```
dApp icons/images should be added to `src/static/media/dapps` and have reflect the filename and path format shown above. 
The network field should reflect one of the following:
- `"mainnet"`
- `"testnet"`
- `"devnet"`
- `"pre-launch"`
To submit, open a PR and leave a semi-detailed note about the dApp you are adding. 
## Labeling Programs
Programs can be labeled via Eclipse XRAY's config file or directly in the [Eclipse Program Registry](https://github.com/Eclipse-Laboratories-Inc/program-registry). 
### Contributing to Eclipse XRAY Config: 
Contributions to `src/lib/xray/config.ts` should be reflect the following example:
```ts
    "SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv": "SWITCHBOARD MAINNET PROGRAM",
```
To submit, open a PR and leave a semi-detailed note about the program address you are adding, and any public listing of the listed address. 
### Contributing to the Eclipse Program Registry:
Visit https://github.com/Eclipse-Laboratories-Inc/program-registry and submit a PR in the following format: 
```yaml
- name: Some Program
  description: Some Program Description 
  repo: https://github.com/some/program
  icon: https://someprogram.com/image
  framework: NextJS
  program_address: "0xSomeProgram"
  categories:
    - Category 1
    - Category 2
    - Category 3
```
Visit the above link for more info about contributions to the EPL

## Writing code
We are currently gearing up for community contributions, but you can find a list of open tasks in `.todo` if you are a spirited developer with some free time on your hands