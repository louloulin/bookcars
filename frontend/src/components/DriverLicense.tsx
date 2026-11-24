import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, IconButton, Input, OutlinedInput } from '@mui/material'
import { Upload as UploadIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'

import '@/assets/css/driver-license.css'

interface DriverLicenseProps {
  user?: bookcarsTypes.User
  variant?: 'standard' | 'outlined'
  hideDelete?: boolean
  className?: string
  onUpload?: (filename: string) => void
  onDelete?: () => void
}

const DriverLicense = ({
  user,
  variant = 'standard',
  hideDelete = false,
  className,
  onUpload,
  onDelete,
}: DriverLicenseProps) => {
  const [license, setLicense] = useState(user?.license || null)
  const [selectedFile, setSelectedFile] = useState<File>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [previewOpen, setPreviewOpen] = useState(false)
  const previewLabel = UserService.getLanguage() === 'zh' ? '预览驾驶证' : 'Preview driver’s license'

  useEffect(() => {
    if (selectedFile && previewOpen) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(undefined)
    return undefined
  }, [selectedFile, previewOpen])

  const handleClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    const upload = document.getElementById('upload-license') as HTMLInputElement
    upload.value = ''
    setTimeout(() => {
      upload.click()
    }, 0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) {
      helper.error()
      return
    }

    const reader = new FileReader()
    const file = e.target.files[0]

    reader.onloadend = async () => {
      try {
        let filename: string | null = null
        if (user) {
          // upload new file
          const res = await UserService.updateLicense(user._id!, file)
          if (res.status === 200) {
            filename = res.data
          } else {
            helper.error()
          }
        } else {
          // Remove previous temp file
          if (license) {
            await UserService.deleteTempLicense(license)
          }
          // upload new file
          filename = await UserService.createLicense(file)
        }

        if (filename) {
          if (onUpload) {
            onUpload(filename)
          }
        }

        setLicense(filename)
        setSelectedFile(filename && !user ? file : undefined)
      } catch (err) {
        helper.error(err)
      }
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className={`driver-license ${className || ''}`}>
      {variant === 'standard' ? (
        <Input
          value={license || commonStrings.UPLOAD_FILE}
          readOnly
          onClick={handleClick}
          className="filename"
        />
      ) : (
        <OutlinedInput
          value={license || commonStrings.UPLOAD_FILE}
          readOnly
          onClick={handleClick}
          className="filename"
        />
      )}
      <div className="actions">
        <IconButton
          onClick={handleClick}
        >
          <UploadIcon className="icon" />
        </IconButton>

        {license && (
          <>
            <IconButton
              aria-label={previewLabel}
              onClick={() => {
                if (user) {
                  helper.downloadURI(`${bookcarsHelper.trimEnd(env.API_HOST, '/')}/api/download-license/${user._id}`)
                } else {
                  setPreviewOpen(true)
                }
              }}
            >
              <ViewIcon className="icon" />
            </IconButton>
            {!hideDelete && (
              <IconButton
                onClick={async () => {
                  try {
                    let status = 0
                    if (user) {
                      status = await UserService.deleteLicense(user._id!)
                    } else {
                      status = await UserService.deleteTempLicense(license!)
                    }

                    if (status === 200) {
                      setLicense(null)
                      setSelectedFile(undefined)

                      if (onDelete) {
                        onDelete()
                      }
                    } else {
                      helper.error()
                    }
                  } catch (err) {
                    helper.error(err)
                  }
                }}
              >
                <DeleteIcon className="icon" />
              </IconButton>
            )}
          </>
        )}
      </div>
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="sm" aria-label={previewLabel}>
        <DialogTitle>{previewLabel}</DialogTitle>
        <DialogContent>
          {previewUrl && selectedFile && (selectedFile.type.startsWith('image/')
            ? <img src={previewUrl} alt={previewLabel} style={{ maxWidth: '100%' }} />
            : <iframe title={previewLabel} src={previewUrl} style={{ width: '100%', height: '60vh', border: 0 }} />)}
        </DialogContent>
      </Dialog>
      <input id="upload-license" type="file" hidden onChange={handleChange} />
    </div>
  )
}

export default DriverLicense
