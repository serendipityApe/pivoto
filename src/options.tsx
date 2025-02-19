import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  Form,
  getKeyValue,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NextUIProvider,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure
} from "@nextui-org/react"
import React, { useEffect, useMemo, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import "./styles/index.css"

export const DeleteIcon = (props) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}>
      <path
        d="M17.5 4.98332C14.725 4.70832 11.9333 4.56665 9.15 4.56665C7.5 4.56665 5.85 4.64998 4.2 4.81665L2.5 4.98332"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.08331 4.14169L7.26665 3.05002C7.39998 2.25835 7.49998 1.66669 8.90831 1.66669H11.0916C12.5 1.66669 12.6083 2.29169 12.7333 3.05835L12.9166 4.14169"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M15.7084 7.61664L15.1667 16.0083C15.075 17.3166 15 18.3333 12.675 18.3333H7.32502C5.00002 18.3333 4.92502 17.3166 4.83335 16.0083L4.29169 7.61664"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M8.60834 13.75H11.3833"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.91669 10.4167H12.0834"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  )
}

export const EditIcon = (props) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}>
      <path
        d="M11.05 3.00002L4.20835 10.2417C3.95002 10.5167 3.70002 11.0584 3.65002 11.4334L3.34169 14.1334C3.23335 15.1084 3.93335 15.775 4.90002 15.6084L7.58335 15.15C7.95835 15.0834 8.48335 14.8084 8.74168 14.525L15.5834 7.28335C16.7667 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2334 1.75002 11.05 3.00002Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
      <path
        d="M9.90833 4.20831C10.2667 6.50831 12.1333 8.26665 14.45 8.49998"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
      <path
        d="M2.5 18.3333H17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
    </svg>
  )
}
type SpecialSearch = {
  title?: string
  description: string
  searchUrl: string
  id: string
}
type StorageData = {
  specialSearch: SpecialSearch[]
}
const isValidURL = (string) => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}
export default function App() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [storageData, setStorageData] = useState<StorageData>({
    specialSearch: []
  })
  const [currentSpecialSearch, setCurrentSpecialSearch] =
    useState<SpecialSearch | null>(null)
  const [formData, setFormData] = React.useState<SpecialSearch>({
    id: "",
    description: "",
    searchUrl: ""
  })
  const [errors, setErrors] = useState({})

  const specialSearch = useMemo(() => {
    return storageData.specialSearch || []
  }, [storageData])
  console.log(storageData, "storageData")

  const defaultContent =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
  const columns = [
    {
      key: "title",
      label: "Title"
    },
    {
      key: "description",
      label: "Description"
    },
    {
      key: "actions",
      label: "Actions"
    }
  ]
  const renderCell = React.useCallback((item, columnKey) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit">
              <span
                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                onClick={() => {
                  setFormData(item)
                  setCurrentSpecialSearch(item)
                  onOpen()
                }}>
                <EditIcon />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Remove">
              <span className="text-lg text-danger cursor-pointer active:opacity-50">
                <DeleteIcon
                  onClick={() => {
                    const updatedSpecialSearch = specialSearch.filter(
                      (_) => _.id !== item.id
                    )

                    // Update storage with the filtered array
                    updateStorage({
                      specialSearch: updatedSpecialSearch
                    })
                  }}
                />
              </span>
            </Tooltip>
          </div>
        )
      default:
        return getKeyValue(item, columnKey)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(e.target, value)

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }
  const storage = chrome.storage.local
  function updateStorage(value) {
    storage.set({
      ...storageData,
      ...value
    })
    getStorage()
  }
  const getStorage = () => {
    storage
      .get(["specialSearch", "maxIndex", "replaceDomain", "disabledActions"])
      .then((res) => {
        setStorageData(res as StorageData)
      })
  }
  useEffect(() => {
    getStorage()
  }, [])
  return (
    <NextUIProvider>
      <div className="px-40 py-4">
        <Accordion
          variant="splitted"
          selectionMode="multiple"
          defaultExpandedKeys={["1", "2"]}>
          <AccordionItem
            key="1"
            aria-label="Accordion 1"
            title="Special search"
            subtitle="To execute an specially search, Usually used to search directly in commonly used websites.">
            <div className="flex justify-end">
              <Button
                color="primary"
                size="sm"
                variant="light"
                onPress={() => {
                  setFormData({
                    id: "",
                    description: "",
                    searchUrl: ""
                  })
                  setCurrentSpecialSearch(null)
                  onOpen()
                }}>
                Add
              </Button>
            </div>
            <Table aria-label="Example table with dynamic content">
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
              </TableHeader>
              <TableBody items={specialSearch}>
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(item, columnKey)}</TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AccordionItem>
          <AccordionItem
            key="2"
            aria-label="Accordion 2"
            title="Panel setting"
            subtitle="Set some controls in the panel">
            {defaultContent}
          </AccordionItem>
        </Accordion>
        <Modal
          isOpen={isOpen}
          placement="top-center"
          onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {currentSpecialSearch ? "Edit" : "Add"}
                </ModalHeader>
                <ModalBody>
                  <Form validationBehavior="native" validationErrors={errors}>
                    <Input
                      labelPlacement="outside"
                      label="Title"
                      placeholder="Enter your Title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                    />
                    <Input
                      isRequired
                      labelPlacement="outside"
                      label="Description"
                      placeholder="Enter Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                    <Input
                      isRequired
                      labelPlacement="outside"
                      label="Url"
                      placeholder="Enter url"
                      name="searchUrl"
                      value={formData.searchUrl}
                      onChange={handleChange}
                    />
                    <div className="flex py-2 px-1 justify-between">
                      <span></span>
                      <Link color="primary" href="#" size="sm">
                        Need help?
                      </Link>
                    </div>
                  </Form>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Close
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => {
                      // Validation function
                      const validate = () => {
                        const newErrors = {} as SpecialSearch

                        if (!formData.description.trim()) {
                          newErrors.description = "Description is required."
                        }

                        if (!formData.searchUrl.trim()) {
                          newErrors.searchUrl = "URL is required."
                        } else if (!isValidURL(formData.searchUrl.trim())) {
                          newErrors.searchUrl = "Please enter a valid URL."
                        }

                        setErrors(newErrors)

                        // Return true if no errors
                        return Object.keys(newErrors).length === 0
                      }
                      if (validate()) {
                        if (currentSpecialSearch) {
                          //edit
                          updateStorage({
                            specialSearch: specialSearch.map((item) => {
                              if (item.id === formData.id) {
                                return formData
                              }
                              return item
                            })
                          })
                        } else {
                          console.log(specialSearch, "specialSearch")
                          updateStorage({
                            specialSearch: specialSearch.concat({
                              ...formData,
                              id: uuidv4()
                            })
                          })
                        }
                        onClose()
                      }
                    }}>
                    Ok
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </NextUIProvider>
  )
}
