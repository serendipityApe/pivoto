import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  cn,
  Form,
  getKeyValue,
  Input,
  Link,
  Listbox,
  ListboxItem,
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

import {
  BookIcon,
  ChatIcon,
  ChevronRightIcon,
  DeleteIcon,
  EditIcon,
  LayoutIcon,
  LikeIcon,
  TagIcon,
  WatchersIcon
} from "~components/Icons"
import KeyTag from "~components/KeyTag"
import { useLocale } from "~locales"

import LocaleProvider from "./components/LocaleProvider"

const discordLink = "https://discord.gg/StkfaaZ7"
const chromeLink =
  "https://chromewebstore.google.com/detail/pivoto/iegmcjfaancbpebgdgjldfadenkceffl/reviews"
export const IconWrapper = ({ children, className }) => (
  <div
    className={cn(
      className,
      "flex items-center rounded-small justify-center w-7 h-7"
    )}>
    {children}
  </div>
)

export const ItemCounter = ({ number }) => (
  <div className="flex items-center gap-1 text-default-400">
    <span className="text-small">{number}</span>
    <ChevronRightIcon className="text-xl" />
  </div>
)

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
  const { t } = useLocale()

  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [storageData, setStorageData] = useState<StorageData>({
    specialSearch: []
  })
  const [shortcuts, setShortcuts] = useState([])
  const [currentSpecialSearch, setCurrentSpecialSearch] =
    useState<SpecialSearch | null>(null)
  const [formData, setFormData] = React.useState<SpecialSearch>({
    id: "",
    description: "",
    searchUrl: ""
  })
  const [errors, setErrors] = useState({})
  const [activeKey, setActiveKey] = useState("faq")
  const specialSearch = useMemo(() => {
    return storageData.specialSearch || []
  }, [storageData])
  console.log(storageData, "storageData")

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
  const urlParams = new URLSearchParams(window.location.search)

  useEffect(() => {
    getStorage()
    // Fetch shortcuts
    chrome.runtime.sendMessage({ request: "command-shortcuts" }, (response) => {
      setShortcuts(response.data.slice(1))
    })

    // Parse URL parameters and set activeKey if tab parameter exists
    const tabParam = urlParams.get("tab")
    if (tabParam) {
      setActiveKey(tabParam)
    }
  }, [])
  console.log(shortcuts, "activeKey")
  return (
    <LocaleProvider>
      <NextUIProvider>
        <div className="px-12 py-12 flex gap-6">
          <Listbox
            aria-label="Settings Menu"
            className="p-0 gap-0 divide-y divide-default-300/50 dark:divide-default-100/80 bg-content1 max-w-[300px] overflow-visible shadow-small rounded-medium"
            itemClasses={{
              base: [
                "px-3 first:rounded-t-medium last:rounded-b-medium rounded-none gap-3 h-12",
                "data-[hover=true]:bg-default-100/80",
                "data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary",
                "data-[focus=true]:bg-primary/10 data-[selected=true]:text-primary",
                "transition-background duration-150"
              ].join(" "),
              title:
                "text-default-foreground group-data-[selected=true]:text-primary",
              selectedIcon: "hidden"
            }}
            selectionMode="single"
            selectedKeys={[activeKey]}
            disallowEmptySelection
            shouldHighlightOnFocus={false}
            onSelectionChange={(keys: Set<string>) => {
              let key = keys.values().next().value
              if (key === activeKey) return
              if (key === "discussions") {
                window.open(discordLink)
              } else {
                setActiveKey(key)
              }
            }}>
            <ListboxItem
              key="general"
              endContent={<ItemCounter number={4} />}
              startContent={
                <IconWrapper className="bg-default/50 text-foreground">
                  <LayoutIcon className="text-lg " />
                </IconWrapper>
              }>
              General
            </ListboxItem>

            <ListboxItem
              key="changelogs"
              className="group h-auto py-3"
              endContent={<ItemCounter number={1} />}
              startContent={
                <IconWrapper className="bg-primary/10 text-primary">
                  <TagIcon className="text-lg" />
                </IconWrapper>
              }
              textValue="Releases">
              Changelogs
            </ListboxItem>
            <ListboxItem
              key="faq"
              startContent={
                <IconWrapper className="bg-danger/10 text-danger dark:text-danger-500">
                  <BookIcon />
                </IconWrapper>
              }>
              FAQ
            </ListboxItem>
            <ListboxItem
              key="like"
              startContent={
                <IconWrapper className="bg-warning/10 text-warning">
                  <LikeIcon />
                </IconWrapper>
              }>
              Like
            </ListboxItem>
            <ListboxItem
              key="discussions"
              startContent={
                <IconWrapper className="bg-secondary/10 text-secondary">
                  <ChatIcon className="text-lg " />
                </IconWrapper>
              }>
              Discussions
            </ListboxItem>
          </Listbox>
          <div className="flex-1">
            {activeKey === "general" && (
              <>
                <Accordion
                  variant="splitted"
                  selectionMode="multiple"
                  defaultExpandedKeys={["1", "2"]}>
                  <AccordionItem
                    key="1"
                    aria-label="Accordion 1"
                    title="Special search in actions"
                    subtitle="To execute an specially search in actions, Usually used to search directly in commonly used websites.">
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
                          <TableColumn key={column.key}>
                            {column.label}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody items={specialSearch}>
                        {(item) => (
                          <TableRow key={item.id}>
                            {(columnKey) => (
                              <TableCell>
                                {renderCell(item, columnKey)}
                              </TableCell>
                            )}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </AccordionItem>
                  <AccordionItem
                    key="2"
                    aria-label="Accordion 2"
                    title={t("shortcuts.title")}
                    subtitle={t("shortcuts.subtitle")}>
                    <div className="flex flex-col gap-4">
                      <Table aria-label="Shortcuts table">
                        <TableHeader>
                          <TableColumn>{t("shortcuts.command")}</TableColumn>
                          <TableColumn>{t("shortcuts.shortcut")}</TableColumn>
                        </TableHeader>
                        <TableBody items={shortcuts}>
                          {(item) => (
                            <TableRow key={item.name}>
                              <TableCell>
                                {item.description || item.name}
                              </TableCell>
                              <TableCell>
                                <KeyTag>
                                  {item.shortcut || t("shortcuts.not_set")}
                                </KeyTag>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <div className="flex justify-end">
                        <Button
                          color="primary"
                          size="sm"
                          variant="light"
                          onPress={() => {
                            chrome.tabs.create({
                              url: "chrome://extensions/shortcuts"
                            })
                          }}>
                          {t("shortcuts.open_settings")}
                        </Button>
                      </div>
                    </div>
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
                          <Form
                            validationBehavior="native"
                            validationErrors={errors}>
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
                              <Link
                                color="primary"
                                href="?tab=faq&faq=0"
                                size="sm">
                                Need help?
                              </Link>
                            </div>
                          </Form>
                        </ModalBody>
                        <ModalFooter>
                          <Button
                            color="danger"
                            variant="flat"
                            onPress={onClose}>
                            Close
                          </Button>
                          <Button
                            color="primary"
                            onPress={() => {
                              // Validation function
                              const validate = () => {
                                const newErrors = {} as SpecialSearch

                                if (!formData.description.trim()) {
                                  newErrors.description =
                                    "Description is required."
                                }

                                if (!formData.searchUrl.trim()) {
                                  newErrors.searchUrl = "URL is required."
                                } else if (
                                  !isValidURL(formData.searchUrl.trim())
                                ) {
                                  newErrors.searchUrl =
                                    "Please enter a valid URL."
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
              </>
            )}

            {activeKey === "changelogs" && (
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Changelogs</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-primary p-4 bg-primary/5 rounded">
                    <h3 className="font-semibold text-lg">Version 0.0.1</h3>
                    <p className="text-sm text-default-500 mb-2">
                      Released on March 17, 2025
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Added special search functionality</li>
                      <li>Improved UI/UX with NextUI components</li>
                      <li>Added multi-language support</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeKey === "faq" && (
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">
                  Frequently Asked Questions
                </h2>

                <Accordion
                  variant="splitted"
                  selectionMode="multiple"
                  defaultExpandedKeys={[urlParams.get("faq") || "1"]}>
                  <AccordionItem
                    key="1"
                    aria-label="Activation Modes"
                    title="What are Pivoto's activation modes?">
                    <div className="space-y-2">
                      <p>
                        Pivoto has two activation modes with default shortcuts:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <strong>
                            {shortcuts.find((s) => s.name === "open-pivoto")
                              ?.shortcut || "Option + Shift + K"}
                          </strong>
                          : Opens the main Pivoto interface for searching tabs,
                          history, and bookmarks
                        </li>
                        <li>
                          <strong>
                            {shortcuts.find((s) => s.name === "cycle-tab")
                              ?.shortcut || "Option + Q"}
                          </strong>
                          : Quickly switches to the last viewed tab (Note: On
                          macOS, this overrides the browser's quit function)
                        </li>
                      </ul>
                      <p className="mt-2 text-sm text-default-500">
                        Due to browser limitations, you can only define
                        shortcuts using Command, Ctrl, or Command + any letter
                        key.
                      </p>
                    </div>
                  </AccordionItem>
                  <AccordionItem
                    key="0"
                    aria-label="Special Search URLs"
                    title="How to Use Special Search URLs?">
                    <div className="space-y-3">
                      <p>
                        Pivoto lets you set up special search URLs to use your
                        preferred search engines or websites.
                      </p>
                      <p className="font-semibold">Setup Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>
                          Go to <strong>Pivoto Settings</strong> →{" "}
                          <strong
                            className="text-primary hover:underline cursor-pointer"
                            onClick={() => {
                              setActiveKey("general")
                            }}>
                            Special Search
                          </strong>
                          .
                        </li>
                        <li>
                          Enter a search URL template using <strong>%s</strong>{" "}
                          as the placeholder for your query.
                          <pre className="bg-gray-100 p-2 rounded">
                            https://www.bing.com/search?q=%s
                          </pre>
                        </li>
                        <li>
                          Save and start searching in Actions(Pivoto will
                          replace <code>%s</code> with your input).
                        </li>
                      </ol>
                      <p className="font-semibold">Examples:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>
                          <strong>Google:</strong>{" "}
                          <code>https://www.google.com/search?q=%s</code>
                        </li>
                        <li>
                          <strong>GitHub:</strong>{" "}
                          <code>https://github.com/search?q=%s&type=code</code>
                        </li>
                        <li>
                          <strong>YouTube:</strong>{" "}
                          <code>
                            https://www.youtube.com/results?search_query=%s
                          </code>
                        </li>
                      </ul>
                      <p>
                        Customize your search experience and make Pivoto work
                        your way! 🚀
                      </p>
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    key="2"
                    aria-label="Main Interface"
                    title="How does the main interface work?">
                    <div className="space-y-2">
                      <p>
                        Press{" "}
                        <strong>
                          {shortcuts.find((s) => s.name === "open-pivoto")
                            ?.shortcut || "Command + Shift + K"}
                        </strong>{" "}
                        to open the main Pivoto interface, which supports:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Searching through all open browser tabs</li>
                        <li>
                          Looking up items in your history and bookmarks (using
                          @)
                        </li>
                        <li>Access to all Pivoto features</li>
                      </ul>
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    key="3"
                    aria-label="Quick Switch"
                    title="How does the quick tab switching work?">
                    <div className="space-y-2">
                      <p>
                        Press{" "}
                        <strong>
                          {shortcuts.find((s) => s.name === "cycle-tab")
                            ?.shortcut || "Command + Q"}
                        </strong>{" "}
                        to quickly switch to the last viewed tab.
                      </p>
                      <p>
                        If you hold{" "}
                        {shortcuts
                          .find((s) => s.name === "cycle-tab")
                          ?.shortcut?.split("")[0] || "Command"}{" "}
                        after pressing{" "}
                        {shortcuts.find((s) => s.name === "cycle-tab")
                          ?.shortcut || "Command + Q"}
                        :
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          A simplified temporary interface appears (without
                          search support)
                        </li>
                        <li>Press Q to choose the tab you want to switch to</li>
                        <li>
                          Releasing{" "}
                          {shortcuts
                            .find((s) => s.name === "cycle-tab")
                            ?.shortcut?.split("")[0] || "Command"}{" "}
                          will complete the switch, even across different
                          browser windows
                        </li>
                      </ul>
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    key="4"
                    aria-label="Tips"
                    title="What are some tips for using Pivoto effectively?">
                    <div className="space-y-2">
                      <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>
                          <strong>Bookmark with keywords:</strong> Save sites
                          with keywords related to their purpose or unique
                          features, making them easier to find later. For
                          example, save Pivoto's official website as "Pivoto
                          plugin productivity beginner guide".
                        </li>
                        <li>
                          <strong>Cross-window navigation:</strong> Pivoto
                          supports not only navigation within browser windows
                          but also fast switching between browser tabs and
                          "installed-as-app" pages.
                        </li>
                        <li>
                          <strong>Search bar shortcuts:</strong> Use the
                          powerful search bar with instant input suggestions
                          (Tab). Navigate quickly with Command + Z, Command + A,
                          Command + →, and Command + ←.
                        </li>
                      </ul>
                    </div>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {activeKey === "like" && (
              <div className="p-4 text-center">
                <h2 className="text-2xl font-bold mb-4">Support Pivoto</h2>
                <div className="max-w-md mx-auto bg-content1 p-6 rounded-xl shadow-sm">
                  <div className="mb-6">
                    <IconWrapper className="mx-auto bg-warning/10 text-warning w-16 h-16 mb-4">
                      <LikeIcon className="text-3xl" />
                    </IconWrapper>
                    <p className="text-lg mb-4">
                      If you enjoy using Pivoto, please consider supporting us!
                    </p>
                    <p className="text-sm text-default-500 mb-6">
                      Your support helps us continue developing new features and
                      improvements.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      color="warning"
                      className="w-full"
                      size="lg"
                      onPress={() => {
                        window.open(chromeLink)
                      }}>
                      <LikeIcon className="mr-2" /> Rate on Chrome Web Store
                    </Button>
                    <Button
                      color="primary"
                      variant="flat"
                      className="w-full"
                      onPress={() => {
                        window.open(discordLink)
                      }}
                      size="lg">
                      <ChatIcon className="mr-2" /> Share Feedback
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </NextUIProvider>
    </LocaleProvider>
  )
}
