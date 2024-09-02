import axios from "axios";
import { db } from "../../modules/firebase-modules/firestore.js";
import { useState, useEffect, useRef } from "react";
import ImageDropZone from "../../components/admin/ImageDropZone";
import TiptapEditor from "../../components/admin/TiptapEditor";
import ProductCard from "../../components/ProductCard.jsx";
import placeholderImg from "../../assets/placeholder-image-icon.webp";
import ProductPagePreview from "../../components/admin/ProductPagePreview.jsx";
import { Typography } from "@material-tailwind/react";
import { GoGoal } from "react-icons/go";
import { MdOutlineArchive } from "react-icons/md";
import "rsuite/TagInput/styles/index.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Toast } from "flowbite-react";
import { toast } from "react-toastify";
import { TagInput } from "rsuite";
import { TagsInput } from "react-tag-input-component";
import InputField from "../../components/InputField.jsx";
import Swal from "sweetalert2";
import storage from "../../modules/firebase-modules/firestorage.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import BouncingBallLoader from "../../components/BouncingBallLoader.jsx";
import { useNavigate } from "react-router-dom";

const AdminNewProductPage = () => {
  const navigate = useNavigate();
  const [isTitleAlreadyExisting, setIsTitleAlreadyExisting] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [primaryImg, setPrimaryImg] = useState(null);
  const [secondary1Img, setSecondary1Img] = useState(null);
  const [secondary2Img, setSecondary2Img] = useState(null);
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [comparePrice, setComparePrice] = useState(null);
  const [descriptionHtml, setDescriptionHtml] = useState(null);
  const [productSavingType, setProductSavingType] = useState("publish");
  const [selectedTags, setSelectedTags] = useState([]);
  const FormRef = useRef(null);
  const [docId, setDocId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishingMsg, setPublishingMsg] = useState("Publishing..");

  const [variants, setVariants] = useState([
    { name: "Default Variant", price, comparePrice },
  ]);

  useEffect(() => {
    setDocId(title.toLowerCase().replace(/ /g, "-"));
    const checkForExistence = async () => {
      if (title.length) {
        try {
          const docRef = doc(
            db,
            "Products",
            title.toLowerCase().replace(/ /g, "-")
          ); // Specify the collection and document ID
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setIsTitleAlreadyExisting(true);
          } else {
            setIsTitleAlreadyExisting(false);
          }
        } catch (error) {
          console.error("Error checking document:", error);
        }
      } else {
        setIsTitleAlreadyExisting(false);
      }
    };
    checkForExistence();
  }, [title]);

  useEffect(() => {
    // Update the price of the default variant when `price` changes
    setVariants((prevVariants) => {
      const updatedVariants = [...prevVariants];
      updatedVariants[0].price = price;
      updatedVariants[0].comparePrice = comparePrice;
      return updatedVariants;
    });
  }, [price]);

  const [openTab, setOpenTab] = useState(1);

  const uploadImage = async (file) => {
    try {
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `images/${file.name}`);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL
      const url = await getDownloadURL(storageRef);

      // Return the URL
      return url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: `${variants.length + 1} Variant Name `,
        price: 0,
        comparePrice: 0,
      },
    ]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index, key, value) => {
    setVariants((prevVariants) => {
      const updatedVariants = [...prevVariants];
      updatedVariants[index][key] = value;
      return updatedVariants;
    });
  };

  const handleFormSubmission = async (e) => {
    e.preventDefault();
    if (!primaryImg || !secondary1Img || !secondary2Img) {
      toast.error("Upload All Images!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      setPublishing(true);
      const primaryImgUrl = await uploadImage(primaryImg);
      setPublishingMsg("Uploading Img 1/3..");
      const secondary1ImgUrl = await uploadImage(secondary1Img);
      setPublishingMsg("Uploading Img 2/3..");
      const secondary2ImgUrl = await uploadImage(secondary2Img);
      setPublishingMsg("Uploading Img 3/3..");
      const productData = {
        primaryImg: primaryImgUrl,
        secondary1Img: secondary1ImgUrl,
        secondary2Img: secondary2ImgUrl,
        title,
        subTitle,
        descriptionHtml,
        price,
        comparePrice,
        tags: selectedTags,
        variants,
      };
      try {
        setPublishingMsg("Connecting to database..");
        const collectionName =
          productSavingType == "publish" ? "Products" : "archives";
        // const documentId =
        const docRef = doc(db, collectionName, docId); // Specify the custom ID here
        await setDoc(docRef, productData); // Upload document with custom ID
        setPublishingMsg("All Set !!");
        Swal.fire({
          text: "Product Added",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "View Products",
          cancelButtonText: "Add another Product",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/admin/products");
          } else {
            window.location.reload();
          }
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
  };

  return (
    <>
      {publishing && (
        <div className="w-full h-screen fixed z-30 inset-0 bg-white flex items-center justify-center flex-col">
          <h1 className="text-black z-50 text-2xl">Publishing Product</h1>
          <img
            src="https://cdnb.artstation.com/p/assets/images/images/028/712/381/original/tim-gilardi-bunny-loading-animation3.gif?1595286299"
            className="w-1/2 md:w-[15rem] mx-auto my-5"
            alt="Loading.."
          />
          <p>{publishingMsg}</p>
        </div>
      )}

      <main className="py-16 px-4 md:w-[80vw] w-screen p-4">
        <div className="w-full flex flex-col justify-center items-center mb-16">
          <h1 className="text-4xl text-left text-gray-800 ">Add a product </h1>
          <h3 className="text-xl text-left  text-gray-800 ">
            Let's create a masterpiece, together{" "}
          </h3>
        </div>

        <section className="md:flex ">
          <form
            className="md:w-1/2 w-full md:px-10"
            onSubmit={handleFormSubmission}
            ref={FormRef}
          >
            <h4 className="py-8 text-left">Add few details to get started</h4>

            <div className="flex flex-col gap-4 ">
              <ImageDropZone storeFileToUpload={setPrimaryImg} />
              <div className="w-full grid grid-cols-2 gap-4">
                <ImageDropZone
                  storeFileToUpload={setSecondary1Img}
                  className={"w-1/2"}
                />
                <ImageDropZone
                  storeFileToUpload={setSecondary2Img}
                  className={"w-1/2"}
                />
              </div>
              <InputField
                inputName={"Title"}
                inputType="text"
                valueReturner={setTitle}
                requiredInput={true}
                errorMsg={
                  isTitleAlreadyExisting &&
                  "Product Already exist, kindly change the title"
                }
              />

              <InputField
                inputName={"Sub title (optional)"}
                inputType="text"
                valueReturner={setSubTitle}
                requiredInput={false}
              />

              <InputField
                inputName={"Price"}
                inputType="number"
                valueReturner={setPrice}
                requiredInput={true}
              />

              <InputField
                inputName={"Compared Price (optional)"}
                inputType="number"
                valueReturner={setComparePrice}
                requiredInput={false}
              />

              <div className="max-w-full">
                <TiptapEditor updateHtml={setDescriptionHtml} />
              </div>

              {/* Variants Management */}
              <div className="mt-6">
                <h4 className="text-left text-lg">Add Variants:</h4>
                <br />
                <div className="flex py-3  border rounded-md border-b-0 items-center justify-between">
                  <p className=" font-semibold">Variant Name</p>
                  <p className=" font-semibold">Price</p>
                  <p className=" font-semibold">Compared Price</p>
                  <button
                    className={`p-2 bg-blue-500 text-white rounded-md `}
                    onClick={() => {
                      addVariant();
                    }}
                    type="button"
                  >
                    Add Variant
                  </button>
                </div>
                {variants.map((variant, index) => (
                  <div key={index} className="mb-4 p-4 border rounded-md">
                    <div className="flex items-center mb-2">
                      <input
                        type="text"
                        placeholder="Variant Name"
                        className="w-1/3 mr-2 p-2 border rounded-md"
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(index, "name", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        className="w-1/3 mr-2 p-2 border rounded-md"
                        {...(index == 0
                          ? { value: price, readOnly: true }
                          : { value: variant.price })}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                      <input
                        type="number"
                        placeholder="Compared Price (optional)"
                        className="w-1/3 mr-2 p-2 border rounded-md"
                        {...(index == 0
                          ? { value: comparePrice, readOnly: true }
                          : { value: variant.comparePrice })}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "comparePrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                      <button
                        {...(index == 0 ? { disabled: true } : {})}
                        className={`p-2 bg-red-500 text-white rounded-md ${
                          index == 0
                            ? "bg-red-200 cursor-not-allowed"
                            : "bg-red-500"
                        }`}
                        type="button"
                        onClick={() => {
                          if (index !== 0) {
                            removeVariant(index);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-end gap-4 my-4 text-left flex-col ">
                  <div className="flex w-full items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="-mt-px h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p>
                      Default Variants Price is the default price of the
                      product.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <TagsInput
                value={selectedTags}
                onChange={(tags) =>
                  setSelectedTags(tags.map((tag) => tag.toLowerCase()))
                }
                name="tags"
                placeHolder="Enter Tags"
                separators={["Enter", ",", " "]}
              />
              <em className="text-left">
                Add tags to show them in relevant collections{" "}
              </em>
            </div>

            <div className="my-10 gap-4 flex ">
              <button
                class="w-full justify-center align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none flex items-center gap-3"
                type="submit"
                onClick={() => {
                  setProductSavingType("publish");
                }}
              >
                <GoGoal className="text-2xl" />
                Publish
              </button>
              <button
                class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg border border-gray-900 text-gray-900 hover:opacity-75 focus:ring focus:ring-gray-300 active:opacity-[0.85] flex items-center gap-3"
                type="submit"
                onClick={() => {
                  setProductSavingType("archive");
                }}
              >
                Archive
                <MdOutlineArchive className="text-2xl" />
              </button>
            </div>
          </form>

          <div className="md:w-1/2 md:m-0 my-10">
            <div className="md:sticky top-8 max-w-full">
              <div className="p-8 w-full">
                <div className=" mx-auto">
                  <div className="mb-4 flex space-x-4 p-2 bg-white rounded-lg shadow-md">
                    <button
                      onClick={() => setOpenTab(1)}
                      className={`flex-1 py-2 px-4 rounded-md focus:outline-none focus:shadow-outline-blue transition-all duration-300 ${
                        openTab === 1 ? "bg-blue-600 text-white" : ""
                      }`}
                    >
                      Card Preview
                    </button>
                    <button
                      onClick={() => setOpenTab(2)}
                      className={`flex-1 py-2 px-4 rounded-md focus:outline-none focus:shadow-outline-blue transition-all duration-300 ${
                        openTab === 2 ? "bg-blue-600 text-white" : ""
                      }`}
                    >
                      Page Preview
                    </button>
                    <button
                      onClick={() => setOpenTab(3)}
                      className={`flex-1 py-2 px-4 rounded-md focus:outline-none focus:shadow-outline-blue transition-all duration-300 ${
                        openTab === 3 ? "bg-blue-600 text-white" : ""
                      }`}
                    >
                      Section 3
                    </button>
                  </div>

                  {openTab === 1 && (
                    <div className="w-full">
                      <ProductCard
                        className={"min-w-[20rem]"}
                        title={title ? title : "Product Name"}
                        price={price ? price : 100}
                        image1={
                          primaryImg
                            ? URL.createObjectURL(primaryImg)
                            : placeholderImg
                        }
                        comparedPrice={comparePrice ? comparePrice : 200}
                      />
                    </div>
                  )}

                  {openTab === 2 && (
                    <ProductPagePreview
                      title={title ? title : "Product Name"}
                      price={price ? price : 100}
                      primaryImg={
                        primaryImg
                          ? URL.createObjectURL(primaryImg)
                          : placeholderImg
                      }
                      comparedPrice={comparePrice ? comparePrice : 200}
                      secondary1Img={
                        secondary1Img
                          ? URL.createObjectURL(secondary1Img)
                          : placeholderImg
                      }
                      secondary2Img={
                        secondary2Img
                          ? URL.createObjectURL(secondary2Img)
                          : placeholderImg
                      }
                      descriptionHtml={descriptionHtml}
                      variants={variants}
                    />
                  )}

                  {openTab === 3 && (
                    <div className="transition-all duration-300 bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-600">
                      <h2 className="text-2xl font-semibold mb-2 text-blue-600">
                        Section 3 Content
                      </h2>
                      <p className="text-gray-700">
                        Fusce hendrerit urna vel tortor luctus, nec tristique
                        odio tincidunt. Vestibulum ante ipsum primis in faucibus
                        orci luctus et ultrices posuere cubilia Curae.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AdminNewProductPage;
