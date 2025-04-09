import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ethers } from "ethers";
import { Row, Form, Button } from "react-bootstrap";
import { S3 as IPFSstorage } from "aws-sdk";
import { useCallback } from "react";
import axios from "axios";

const bucket = "xie-nft-marketplace";
const IPFS = new IPFSstorage({
  endpoint: "https://s3.filebase.com",
  signatureVersion: "v4",
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
});

export default function Resell({ marketplace, nft }) {
  const [imageURL, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const keyToNFT = location.state;

  const base_URL = "https://ridiculous-pink-boar.myfilebase.com/ipfs/";

  const resellNFT = async () => {
    console.log(imageURL, price, name, description);
    if (!imageURL || !price || !name || !description) return;
    try {
      IPFS.putObject(
        {
          Bucket: bucket,
          Key: name,
          Body: JSON.stringify({ imageURL, price, name, description }),
          ContentType: "text/plain",
        },
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            const itemCount = marketplace.itemCount();
            for (let item = 1; item <= itemCount; item++) {
              if (item.name === name) {
                marketplace.resetItem(item.id);
              }
            }
            mintThenList(name);
            navigate("/");
          }
        }
      );
    } catch (error) {
      console.log("ipfs uri upload error: ", error);
    }
  };

  const mintThenList = async (result) => {
    // const uri = `https://ipfs.infura.io/ipfs/${result.path}`;
    IPFS.getObject(
      {
        Bucket: bucket,
        Key: result,
      },
      async (error, tokenCID) => {
        if (error) {
          console.log(error);
        } else {
          // mint nft
          await (await nft.mint(base_URL + tokenCID.Metadata.cid)).wait();
          // get tokenId of new nft
          const id = await nft.tokenCount();
          // approve marketplace to spend nft
          await (await nft.setApprovalForAll(marketplace.address, true)).wait();
          // add nft to marketplace
          const listingPrice = ethers.utils.parseEther(price.toString());
          await (
            await marketplace.makeItem(nft.address, id, listingPrice)
          ).wait();
          console.log("Something made");
        }
      }
    );
  };

  const fetchResellNFTTokenData = useCallback(async () => {
    IPFS.getObject(
      {
        Bucket: bucket,
        Key: keyToNFT,
      },
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          const url = base_URL + data.Metadata.cid;
          axios.get(url).then((response) => {
            const nftToken = response.data;
            console.log(nftToken.imageURL);
            setImage(nftToken.imageURL);
            setName(nftToken.name);
            setDescription(nftToken.description);
            setPrice(nftToken.price);
          });
        }
      }
    );
  }, []);

  useEffect(() => {
    fetchResellNFTTokenData();
  }, [fetchResellNFTTokenData]);

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main
          role="main"
          className="col-lg-12 mx-auto"
          style={{ maxWidth: "1000px" }}
        >
          <div className="content mx-auto">
            <Row className="g-4">
              {imageURL ? (
                <div className="w-241 h-241 rounded-md">
                  <img src={imageURL} alt="NFTTokenImage" />
                </div>
              ) : (
                <Form.Control type="file" required name="file" />
              )}
              <Form.Control
                onChange={(e) => setName(e.target.value)}
                size="lg"
                required
                disabled
                type="text"
                value={name}
                placeholder="Name"
              />
              <Form.Control
                onChange={(e) => setDescription(e.target.value)}
                size="lg"
                required
                as="textarea"
                value={description}
                placeholder="Description"
              />
              <Form.Control
                onChange={(e) => setPrice(e.target.value)}
                size="lg"
                required
                type="number"
                value={price}
                placeholder="Price in ETH"
              />
              <div className="d-grid px-0">
                <Button onClick={resellNFT} variant="primary" size="lg">
                  Resell
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}
