import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IResolveParams,
  LoginSocialFacebook,
  LoginSocialApple,
  LoginSocialGoogle,
} from ':reactjs-social-login'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'
import env from '@/config/env.config'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'

import FacebookIcon from '@/assets/img/facebook-icon.png'
import AppleIcon from '@/assets/img/apple-icon.png'
import GoogleIcon from '@/assets/img/google-icon.png'

import '@/assets/css/social-login.css'

const REDIRECT_URI = window.location.href

// .env.example 里的占位值（如 XXXXXXXXXX）表示该渠道未配置。
// 未配置时隐藏对应按钮：否则 GSI 会向 accounts.google.com 反复请求并返回 403，
// 用户看到的是一个永远无法使用的按钮。
const isConfigured = (id?: string) => {
  const value = (id ?? '').trim()
  if (!value) {
    return false
  }
  return !/^x+$/i.test(value) && value.toLowerCase() !== 'undefined'
}

interface SocialLoginProps {
  facebook?: boolean
  apple?: boolean
  google?: boolean
  redirectToHomepage?: boolean
  reloadPage?: boolean
  className?: string
  onError?: (error: any) => void
  onSignInError?: () => void
  onBlackListed?: () => void
}

const SocialLogin = ({
  facebook,
  apple,
  google = true,
  redirectToHomepage,
  reloadPage,
  className,
  onError,
  onSignInError,
  onBlackListed }: SocialLoginProps) => {
  const navigate = useNavigate()

  const { setUser, setUserLoaded } = useUserContext() as UserContextType

  const loginSuccess = async (socialSignInType: bookcarsTypes.SocialSignInType, accessToken: string, email: string, fullName: string, avatar?: string) => {
    const data: bookcarsTypes.SignInPayload = {
      socialSignInType,
      accessToken,
      email,
      fullName,
      avatar,
      stayConnected: UserService.getStayConnected()
    }

    const res = await UserService.socialSignin(data)
    if (res.status === 200) {
      if (res.data.blacklisted) {
        await UserService.signout(false)
        if (onBlackListed) {
          onBlackListed()
        }
      } else {
        const user = await UserService.getUser(res.data._id)
        setUser(user)
        setUserLoaded(true)

        if (redirectToHomepage) {
          navigate('/')
        }

        if (reloadPage) {
          navigate(0)
        }
      }
    } else if (onSignInError) {
      onSignInError()
    }
  }

  const loginError = (err: any) => {
    console.log(err)
    if (onError) {
      onError(err)
    }
  }

  const showFacebook = Boolean(facebook) && isConfigured(env.FB_APP_ID)
  const showApple = Boolean(apple) && isConfigured(env.APPLE_ID)
  const showGoogle = Boolean(google) && isConfigured(env.GG_APP_ID)

  if (!showFacebook && !showApple && !showGoogle) {
    return null
  }

  const getEmail = (jwtToken: string) => {
    const jwt = UserService.parseJwt(jwtToken)
    const { email } = jwt
    return email
  }

  return (
    <div className={`${className ? `${className} ` : ''}social-login`}>
      {(showFacebook || showApple || showGoogle) && (
        <div className="separator">
          <hr />
          <span>{commonStrings.OR}</span>
          <hr />
        </div>
      )}

      <div className="login-buttons">
        {showFacebook && (
          <LoginSocialFacebook
            appId={env.FB_APP_ID}
            redirect_uri={REDIRECT_URI}
            onResolve={({ data }: IResolveParams) => {
              loginSuccess(bookcarsTypes.SocialSignInType.Facebook, data?.accessToken, data?.email, data?.name, data?.picture?.data?.url)
            }}
            onReject={(err: any) => {
              loginError(err)
            }}
            className="social"
          >
            <img alt="Facebook" src={FacebookIcon} className="social" />
          </LoginSocialFacebook>
        )}

        {showApple && (
          <LoginSocialApple
            client_id={env.APPLE_ID}
            scope="name email"
            redirect_uri={REDIRECT_URI}
            onResolve={({ data }: IResolveParams) => {
              const email = data?.user?.email || getEmail(String(data?.id_token))
              loginSuccess(bookcarsTypes.SocialSignInType.Apple, data?.id_token, email, data?.user ? `${data?.user?.firstName} ${data?.user?.lastName}` : email)
            }}
            onReject={(err: any) => {
              loginError(err)
            }}
            className="social"
          >
            <img alt="Apple" src={AppleIcon} className="social" />
          </LoginSocialApple>
        )}

        {showGoogle && (
          <LoginSocialGoogle
            client_id={env.GG_APP_ID}
            typeResponse="idToken"
            redirect_uri={REDIRECT_URI}
            scope="openid profile email"
            discoveryDocs="claims_supported"
            onResolve={({ data }: IResolveParams) => {
              loginSuccess(bookcarsTypes.SocialSignInType.Google, data?.credential, data?.email, data?.name || data?.email, data?.picture)
            }}
            onReject={(err: any) => {
              loginError(err)
            }}
            className="social"
          >
            <img alt="Google" src={GoogleIcon} className="social" />
          </LoginSocialGoogle>
        )}
      </div>
    </div>
  )
}

export default SocialLogin
