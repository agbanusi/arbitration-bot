package main

import (
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"math/big"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
	"github.com/quan8/go-ethereum/crypto"

	store "test1/abiStore" // for demo
)

type FullPairs struct {
	Tpairs []TokenPair `json:"full_pairs"`
}

type TokenPair struct {
	Symbols string   `json:"symbols"`
	Pairs   []string `json:"pairs"`
}

type Token struct {
	address common.Address
	symbol  string
}

type Tokens struct {
	wmatic Token
	eth    Token
	busd   Token
	usdt   Token
	wbnb   Token
}

func main() {
	// load .env file from given path
	// we keep it empty it will load .env from current directory
	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	client, err := ethclient.Dial("https://polygon-mainnet.g.alchemy.com/v2/OOkdqTs_MldhfiyK08pcOnzUCWdtyN8J")
	if err != nil {
		println(err)
	}

	privateKey, err := crypto.HexToECDSA(os.Getenv("PrivateKey"))
	if err != nil {
		println(err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		println("cannot assert type: publicKey is not of type *ecdsa.PublicKey")
	}

	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		println(err)
	}

	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		println(err)
	}

	auth, _ := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(137))
	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)     // in wei
	auth.GasLimit = uint64(300000) // in units
	auth.GasPrice = gasPrice
	//auth.NoSend = true
	runtime.GOMAXPROCS(runtime.NumCPU())

	address := common.HexToAddress("0xcDba6c96d4F4c67F417Aa7e7BCb65e0EC3DbbbA4")
	flashBot, err := store.NewStore(address, client)
	if err != nil {
		println(err)
	}

	file, _ := ioutil.ReadFile("./pairs-polygon.json")
	var filePairs []TokenPair
	// we unmarshal our byteArray which contains our
	json.Unmarshal(file, &filePairs)
	//fmt.Printf("%+v\n", filePairs)

	maticBaseTokens := Tokens{
		wmatic: Token{symbol: "WMATIC", address: common.HexToAddress("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270")},
		eth:    Token{symbol: "ETH", address: common.HexToAddress("0xFD30BAee9842A806814675cE45D44b5519014dD7")},
		busd:   Token{symbol: "BUSD", address: common.HexToAddress("0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7")},
		usdt:   Token{symbol: "USDT", address: common.HexToAddress("0xc2132D05D31c914a87C6611C10748AEb04B58e8F")},
		wbnb:   Token{symbol: "BNB", address: common.HexToAddress("0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005")},
	}

	baseTokens := maticBaseTokens
	// using for loop
	for {
		for i := 0; i < len(filePairs); i++ {
			//println(filePairs[i].Symbols)
			go arbitrageFunc(flashBot, baseTokens, filePairs[i], auth, client)
		}
		time.Sleep(3 * time.Second)
	}

}

func getProfitRetry(flashBot *store.Store, pair00 common.Address, pair10 common.Address) (res struct {
	Profit    *big.Int
	BaseToken common.Address
}, returnedErr error, pair0 common.Address, pair1 common.Address) {

	res, err := flashBot.GetProfit(nil, pair00, pair10)

	if err != nil {
		_err := err.Error()
		if strings.Contains(_err, "429") {
			time.Sleep(2500 * time.Millisecond)
			return getProfitRetry(flashBot, pair00, pair10)
		} else if strings.Contains(_err, "Wrong input order") {
			time.Sleep(1000 * time.Millisecond)
			return getProfitRetry(flashBot, pair10, pair00)
		}
		return res, err, pair00, pair10
	}

	return res, err, pair00, pair10
}

func arbitrageFunc(flashBot *store.Store, baseTokens Tokens, pair TokenPair, auth2 *bind.TransactOpts, client *ethclient.Client) {
	//for true {
	pair00 := common.HexToAddress(pair.Pairs[0])
	pair10 := common.HexToAddress(pair.Pairs[1])

	res, err, pair0, pair1 := getProfitRetry(flashBot, pair00, pair10)
	if err != nil {
		println("lp error", err.Error())
		return
	}

	if res.Profit.Uint64() > 0 {
		netProfit := calcNetProfit(res.Profit.Uint64(), res.BaseToken, baseTokens, client)
		prof := fmt.Sprintf("%f", netProfit)
		println("Net Profit on " + string(pair.Symbols) + ": " + prof)

		if netProfit < 10 {
			return //continue
		}

		println(`Calling flash arbitrage, net profit: ${netProfit}`)

		response, err := flashBot.FlashArbitrage(auth2, pair0, pair1)
		// print("response")
		// println(response)
		// fmt.Printf("tx sent: %s", response.Hash())
		// fmt.Printf("tx sent: %s", response.Hash().Hex())
		if err != nil {
			println("_error", err.Error())
			return
		}
		fmt.Printf("tx sent: %s", response.Hash().Hex())
	}

}

func calcNetProfit(profitWei uint64, address common.Address, baseTokens Tokens, client *ethclient.Client) float64 {
	var price float64 = 1
	if baseTokens.wmatic.address == address {
		price = 1
	}

	profit := float64(profitWei) / math.Pow(10, 18)
	profit = profit * price

	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		//println("ërr", err.Error())
		return profit
	}
	var gas = float64(gasPrice.Uint64()) / math.Pow(10, 18)

	var gasCost float64 = price * gas * 1.50 * 300000
	return profit - gasCost
}
