import { useState } from "react";
import { ethers } from "ethers";
import { Row, Form, Button } from "react-bootstrap";
import { S3 as IPFSstorage } from "aws-sdk";

const bucket = "xie-nft-marketplace";
const IPFS = new IPFSstorage({
  endpoint: "https://s3.filebase.com",
  signatureVersion: "v4",
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
});
// import { create as ipfsHttpClient } from "ipfs-http-client";
// const client = ipfsHttpClient("https://api.filebase.io/v1/ipfs");

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState("");
  const [price, setPrice] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tokenURI, setTokenURI] = useState("");

  const base_URL = "https://ridiculous-pink-boar.myfilebase.com/ipfs/";
  // const uploadToIPFS = async (event) => {
  //   event.preventDefault();
  //   const file = event.target.files[0];
  //   if (typeof file !== "undefined") {
  //     try {
  //       const result = await client.add(file);
  //       console.log(result);
  //       setImage(`https://ipfs.infura.io/ipfs/${result.path}`);
  //     } catch (error) {
  //       console.log("ipfs image upload error: ", error);
  //     }
  //   }
  // };

  const uploadToIPFS = async (event) => {
    const file = event.target.files[0];

    if (typeof file !== "undefined") {
      var params = {
        Bucket: bucket,
        Key: file.name,
        Body: file,
        ContentType: "text/mixed",
      };

      IPFS.putObject(params, (error, data) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Success");
          console.log(data);
          setImage(file.name);
        }
      });
    }
  };

  const createNFT = async () => {
    console.log(image, price, name, description);
    if (!image || !price || !name || !description) return;
    try {
      // const result = await client.add(
      //   JSON.stringify({ image, price, name, description })
      // );
      // image = base_URL + image;
      IPFS.getObject(
        {
          Bucket: bucket,
          Key: image,
        },
        (error, imageCID) => {
          if (error) {
            console.log(error);
          } else {
            var imageURL = base_URL + imageCID.Metadata.cid;
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
                  console.log(data);
                  mintThenList(name);
                }
              }
            );
          }
        }
      );
    } catch (error) {
      console.log("ipfs uri upload error: ", error);
    }
  };
  const mintThenList = async (result) => {
    // const uri = `https://ipfs.infura.io/ipfs/${result.path}`;
    const uri = IPFS.getObject(
      {
        Bucket: bucket,
        Key: result,
      },
      async (error, tokenCID) => {
        if (error) {
          console.log(error);
        } else {
          // mint nft
          setTokenURI(base_URL + tokenCID.Metadata.cid);
          console.log(base_URL + tokenCID.Metadata.cid);
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
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control
                onChange={(e) => setName(e.target.value)}
                size="lg"
                required
                type="text"
                placeholder="Name"
              />
              <Form.Control
                onChange={(e) => setDescription(e.target.value)}
                size="lg"
                required
                as="textarea"
                placeholder="Description"
              />
              <Form.Control
                onChange={(e) => setPrice(e.target.value)}
                size="lg"
                required
                type="number"
                placeholder="Price in ETH"
              />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Create;
