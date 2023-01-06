import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

import {  useState, useEffect } from 'react';
import { ethers } from "ethers";
import {ToastContainer, toast} from "react-toastify";

import WRHeader from 'wrcomponents/dist/WRHeader';
import WRFooter, { async } from 'wrcomponents/dist/WRFooter';
import WRInfo from 'wrcomponents/dist/WRInfo';
import WRContent from 'wrcomponents/dist/WRContent';
import WRTools from 'wrcomponents/dist/WRTools';
import Button from "react-bootstrap/Button";

import { format6FirstsAnd6LastsChar } from "./utils";
import meta from "./assets/metamask.png";

import LotteryContract from './artifacts/contracts/Lottery.sol/Lottery.json';


function App() {

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({});
  const [provider, setProvider] = useState();
  const [contract, setContract] = useState();
  const [signer, setSigner] = useState();

  const [currentState, setCurrentState] = useState('');
  const [maxNumPlayers, setMaxNumPlayers] = useState('');
  const [moneyRequiredToBet, setMoneyRequiredToBet] = useState('');
  const [houseFee, setHouseFee] = useState('');
  const [admin, setAdmin] = useState('');

  const [betNumPlayers, setBetNumPlayers] = useState('');
  const [betMoney, setBetMoney] = useState('');

  const contractAddress = '0xD63eE9266D6b74543aBf3937b67290e93e5ff23F';
  
  async function handleConnectWallet (){
    try {
      setLoading(true)
      let userAcc = await provider.send('eth_requestAccounts', []);
      setUser({account: userAcc[0], connected: true});

      const contrSig = new ethers.Contract(contractAddress, LotteryContract.abi, provider.getSigner())
      setSigner( contrSig)

    } catch (error) {
      if (error.message == 'provider is undefined'){
        toastMessage('No provider detected.')
      } else if(error.code === -32002){
        toastMessage('Check your metamask')
      }
    } finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    
    async function getData() {
      try {
        const {ethereum} = window;
        if (!ethereum){
          toastMessage('Metamask not detected');
          return
        }
        console.log('entrou aqui');
        const prov =  new ethers.providers.Web3Provider(window.ethereum);
        setProvider(prov);

        const contr = new ethers.Contract(contractAddress, LotteryContract.abi, prov);
        setContract(contr);
        
        if (! await isGoerliTestnet()){
          toastMessage('Change to goerli testnet.')
          return;
        }

        //contract data
        const currState = (await contr.currentState())
        if (currState == 0){
          setCurrentState("Idle")
        }else if (currState == 1){
          setCurrentState("Betting")
        }
        
        setMaxNumPlayers((await contr.maxNumPlayers()).toString())
        setMoneyRequiredToBet((await contr.moneyRequiredToBet()).toString())
        setHouseFee((await contr.houseFee()).toString())
        setAdmin(await contr.admin())
        toastMessage('Data loaded')
        
      } catch (error) {
        console.log(error);
        toastMessage(error.reason)        
      }
      
    }

    getData()  
    
  }, [])
  
  function isConnected(){
    if (!user.connected){
      toastMessage('You are not connected!')
      return false;
    }
    
    return true;
  }

  async function isGoerliTestnet(){
    const goerliChainId = "0x5";
    const respChain = await getChain();
    return goerliChainId == respChain;
  }

  async function getChain() {
    const currentChainId = await  window.ethereum.request({method: 'eth_chainId'})
    return currentChainId;
  }

  async function handleDisconnect(){
    try {
      setUser({});
      setSigner(null);
    } catch (error) {
      toastMessage(error.reason)
    }
  }

  function toastMessage(text) {
    toast.info(text)  ;
  }

  async function executeSigner(func, successMessage){
    try {
      if (!isConnected()) {
        return;
      }
      if (! await isGoerliTestnet()){
        toastMessage('Change to goerli testnet.')
        return;
      }
      setLoading(true);
      const resp  = await func;  
      toastMessage("Please wait.")
      await resp.wait();
      toastMessage(successMessage)
    } catch (error) {
      toastMessage(error.reason)      
    } finally{
      setLoading(false);
    }
  }

  function toTimestamp(strDate){
    let dateFormatted = Date.parse(strDate);
    return dateFormatted;
  }

  async function handleCreateBet(){
    if (signer === undefined){
      toastMessage("Please, connect your metamask")
      return
    }
    const func = signer.createBet(betNumPlayers, betMoney); 
    executeSigner(func, "Bet Created.")
    
  }

  async function handleCancel(){
    if (signer === undefined){
      toastMessage("Please, connect your metamask")
      return
    }
    const func = signer.cancel();
    executeSigner(func, "Bet Cancelled.")
  }

  async function handlebET(){
    if (signer === undefined){
      toastMessage("Please, connect your metamask")
      return
    }
    const func = signer.contractDeployedSigner.bet({value: moneyRequiredToBet});
    executeSigner(func, "Bet.")
  }

  return (
    <div className="App">
      <ToastContainer position="top-center" autoClose={5000}/>
      <WRHeader title="LOTTERY" image={true} />
      <WRInfo chain="Goerli" testnet={true} />
      <WRContent>
        
        <h1>LOTTERY</h1>
        {loading && 
          <h1>Loading....</h1>
        }
        { !user.connected ?<>
            <Button className="commands" variant="btn btn-primary" onClick={handleConnectWallet}>
              <img src={meta} alt="metamask" width="30px" height="30px"/>Connect to Metamask
            </Button></>
          : <>
            <label>Welcome {format6FirstsAnd6LastsChar(user.account)}</label>
            <button className="btn btn-primary commands" onClick={handleDisconnect}>Disconnect</button>
          </>
        }
        
        <hr/>
        <h2>Contract data</h2>
        <label>Admin: {admin}</label>
        <label>Current state: {currentState}</label>
        { currentState == 'Betting' &&
          <>
            <label>Max. Num. Players: {maxNumPlayers}</label>
            <label>Money required to bet: {moneyRequiredToBet}</label>
          </>
        }
        
        <label>House Fee: {houseFee}</label>
        <hr/>

        <h2>Create bet (only admin)</h2>
        <input type="number" className="commands" placeholder="Number of players" onChange={(e) => setBetNumPlayers(e.target.value)} value={betNumPlayers}/>
        <input type="number" className="commands" placeholder="Bet money" onChange={(e) => setBetMoney(e.target.value)} value={betMoney}/>
        <button className="btn btn-primary commands" onClick={handleCreateBet}>Click to create the bet</button>
        <hr/>

        <h2>BET</h2>
        <button className="btn btn-primary commands" onClick={handlebET}>Click to BET</button>
        <hr/>

        <h2>Cancel bet (only admin)</h2>
        <button className="btn btn-primary commands" onClick={handleCancel}>Click to cancel the bet</button>
               
      </WRContent>
      <WRTools react={true} hardhat={true} bootstrap={true} solidity={true} css={true} javascript={true} ethersjs={true} />
      <WRFooter />      
    </div>
  );
}

export default App;
