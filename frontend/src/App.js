//import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

import {  useState, useEffect } from 'react';
import { ethers } from "ethers";
import {ToastContainer, toast} from "react-toastify";

import WRHeader from 'wrcomponents/dist/WRHeader';
import WRFooter from 'wrcomponents/dist/WRFooter';
import WRInfo from 'wrcomponents/dist/WRInfo';
import WRContent from 'wrcomponents/dist/WRContent';
import WRTools from 'wrcomponents/dist/WRTools';

import LotteryContract from './artifacts/contracts/Lottery.sol/Lottery.json';


function App() {

  const [userAccount, setUserAccount] = useState('');

  const [currentState, setCurrentState] = useState('');
  const [maxNumPlayers, setMaxNumPlayers] = useState('');
  const [moneyRequiredToBet, setMoneyRequiredToBet] = useState('');
  const [houseFee, setHouseFee] = useState('');
  const [admin, setAdmin] = useState('');

  const [betNumPlayers, setBetNumPlayers] = useState('');
  const [betMoney, setBetMoney] = useState('');

  const addressContract = '0xD63eE9266D6b74543aBf3937b67290e93e5ff23F';
  
  let contractDeployed = null;
  let contractDeployedSigner = null;
  
  async function getProvider(connect = false){
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (contractDeployed == null){
      contractDeployed = new ethers.Contract(addressContract, LotteryContract.abi, provider)
    }
    if (contractDeployedSigner == null){
      if (connect){
        let userAcc = await provider.send('eth_requestAccounts', []);
        setUserAccount(userAcc[0]);
      }
      contractDeployedSigner = new ethers.Contract(addressContract, LotteryContract.abi, provider.getSigner());
    }
  }

  async function disconnect(){
    try {
      setUserAccount('');
    } catch (error) {
      
    }
  }

  useEffect(() => {
    getData()
  }, [])

  function toastMessage(text) {
    toast.info(text)  ;
  }

  function toTimestamp(strDate){
    let dateFormatted = Date.parse(strDate);
    return dateFormatted;
  }

  function formatDate(dateTimestamp){
    let date = new Date(parseInt(dateTimestamp));
    let dateFormatted = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() ;
    return dateFormatted;
  }

  async function getData(connect = false) {
    await getProvider(connect);
    const currState = (await contractDeployed.currentState())
    if (currState == 0){
      setCurrentState("Idle")
    }else if (currState == 1){
      setCurrentState("Betting")
    }
    setMaxNumPlayers((await contractDeployed.maxNumPlayers()).toString())
    setMoneyRequiredToBet((await contractDeployed.moneyRequiredToBet()).toString())
    setHouseFee((await contractDeployed.houseFee()).toString())
    setAdmin(await contractDeployed.admin())
  }

  async function handleCreateBet(){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.createBet(betNumPlayers, betMoney);  
      toastMessage("Bet created.")
    } catch (error) {
      toastMessage(error.reason);
    }
  }

  async function handleCancel(){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.cancel();  
      toastMessage("Bet cancelled.")
    } catch (error) {
      toastMessage(error.reason);
    }
  }

  async function handlebET(){
    await getProvider(true);
    try {
      const resp  = await contractDeployedSigner.bet({value: moneyRequiredToBet});  
      toastMessage("Bet")
    } catch (error) {
      toastMessage(error.reason);
    }
  }

  return (
    <div className="App">
      <ToastContainer position="top-center" autoClose={5000}/>
      <WRHeader title="EVENT ORGANIZATION" image={true} />
      <WRInfo chain="Goerli testnet" />
      <WRContent>
        
        {
          userAccount =='' ?<>
            <h2>Connect your wallet</h2>
            <button onClick={() => getData(true)}>Connect</button>
          </>
          :<>
            <h2>User data</h2>
            <p>User account: {userAccount}</p>
            <button onClick={disconnect}>Disconnect</button></>
        }
        
        <hr/>
        <h2>Contract data</h2>
        <p>Admin: {admin}</p>
        <p>Current state: {currentState}</p>
        { currentState == 'Betting' &&
          <>
            <p>Max. Num. Players: {maxNumPlayers}</p>
            <p>Money required to bet: {moneyRequiredToBet}</p>
          </>
        }
        
        <p>House Fee: {houseFee}</p>
        <hr/>

        <h2>Create bet (only admin)</h2>
        <input type="text" placeholder="Number of players" onChange={(e) => setBetNumPlayers(e.target.value)} value={betNumPlayers}/>
        <input type="text" placeholder="Bet money" onChange={(e) => setBetMoney(e.target.value)} value={betMoney}/>
        <button onClick={handleCreateBet}>Click to create the bet</button>
        <hr/>

        <h2>BET</h2>
        <button onClick={handlebET}>Click to BET</button>

        <h2>Cancel bet (only admin)</h2>
        <button onClick={handleCancel}>Click to cancel the bet</button>
        
               
      </WRContent>
      <WRTools react={true} hardhat={true} bootstrap={true} solidity={true} css={true} javascript={true} ethersjs={true} />
      <WRFooter />      
    </div>
  );
}

export default App;
