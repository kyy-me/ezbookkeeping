package api

import (
	"sort"

	"github.com/kyy-me/ezbookkeeping/pkg/core"
	"github.com/kyy-me/ezbookkeeping/pkg/errs"
	"github.com/kyy-me/ezbookkeeping/pkg/log"
	"github.com/kyy-me/ezbookkeeping/pkg/models"
	"github.com/kyy-me/ezbookkeeping/pkg/services"
	"github.com/kyy-me/ezbookkeeping/pkg/utils"
)

// TokensApi represents token api
type TokensApi struct {
	tokens *services.TokenService
	users  *services.UserService
}

// Initialize a token api singleton instance
var (
	Tokens = &TokensApi{
		tokens: services.Tokens,
		users:  services.Users,
	}
)

// TokenListHandler returns available token list of current user
func (a *TokensApi) TokenListHandler(c *core.Context) (any, *errs.Error) {
	uid := c.GetCurrentUid()
	tokens, err := a.tokens.GetAllUnexpiredNormalTokensByUid(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[tokens.TokenListHandler] failed to get all tokens for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	tokenResps := make(models.TokenInfoResponseSlice, len(tokens))
	claims := c.GetTokenClaims()

	for i := 0; i < len(tokens); i++ {
		token := tokens[i]
		tokenResp := &models.TokenInfoResponse{
			TokenId:   a.tokens.GenerateTokenId(token),
			TokenType: token.TokenType,
			UserAgent: token.UserAgent,
			CreatedAt: token.CreatedUnixTime,
			ExpiredAt: token.ExpiredUnixTime,
		}

		if token.Uid == claims.Uid && utils.Int64ToString(token.UserTokenId) == claims.UserTokenId && token.CreatedUnixTime == claims.IssuedAt {
			tokenResp.IsCurrent = true
		}

		tokenResps[i] = tokenResp
	}

	sort.Sort(tokenResps)

	return tokenResps, nil
}

// TokenRevokeCurrentHandler revokes current token of current user
func (a *TokensApi) TokenRevokeCurrentHandler(c *core.Context) (any, *errs.Error) {
	_, claims, err := a.tokens.ParseTokenByHeader(c)

	if err != nil {
		return nil, errs.Or(err, errs.NewIncompleteOrIncorrectSubmissionError(err))
	}

	userTokenId, err := utils.StringToInt64(claims.UserTokenId)

	if err != nil {
		log.WarnfWithRequestId(c, "[tokens.TokenRevokeCurrentHandler] parse user token id failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	tokenRecord := &models.TokenRecord{
		Uid:             claims.Uid,
		UserTokenId:     userTokenId,
		CreatedUnixTime: claims.IssuedAt,
	}

	tokenId := a.tokens.GenerateTokenId(tokenRecord)
	err = a.tokens.DeleteToken(c, tokenRecord)

	if err != nil {
		log.ErrorfWithRequestId(c, "[token.TokenRevokeCurrentHandler] failed to revoke token \"id:%s\" for user \"uid:%d\", because %s", tokenId, claims.Uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[token.TokenRevokeCurrentHandler] user \"uid:%d\" has revoked token \"id:%s\"", claims.Uid, tokenId)
	return true, nil
}

// TokenRevokeHandler revokes specific token of current user
func (a *TokensApi) TokenRevokeHandler(c *core.Context) (any, *errs.Error) {
	var tokenRevokeReq models.TokenRevokeRequest
	err := c.ShouldBindJSON(&tokenRevokeReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[tokens.TokenRevokeHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	tokenRecord, err := a.tokens.ParseFromTokenId(tokenRevokeReq.TokenId)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[token.TokenRevokeHandler] failed to parse token \"id:%s\", because %s", tokenRevokeReq.TokenId, err.Error())
		}

		return nil, errs.Or(err, errs.ErrInvalidTokenId)
	}

	uid := c.GetCurrentUid()

	if tokenRecord.Uid != uid {
		log.WarnfWithRequestId(c, "[token.TokenRevokeHandler] token \"id:%s\" is not owned by user \"uid:%d\"", tokenRevokeReq.TokenId, uid)
		return nil, errs.ErrInvalidTokenId
	}

	err = a.tokens.DeleteToken(c, tokenRecord)

	if err != nil {
		log.ErrorfWithRequestId(c, "[token.TokenRevokeHandler] failed to revoke token \"id:%s\" for user \"uid:%d\", because %s", tokenRevokeReq.TokenId, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[token.TokenRevokeHandler] user \"uid:%d\" has revoked token \"id:%s\"", uid, tokenRevokeReq.TokenId)
	return true, nil
}

// TokenRevokeAllHandler revokes all tokens of current user except current token
func (a *TokensApi) TokenRevokeAllHandler(c *core.Context) (any, *errs.Error) {
	uid := c.GetCurrentUid()
	tokens, err := a.tokens.GetAllTokensByUid(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[tokens.TokenRevokeAllHandler] failed to get all tokens for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	claims := c.GetTokenClaims()
	currentTokenIndex := 0

	for i := 0; i < len(tokens); i++ {
		token := tokens[i]

		if token.Uid == claims.Uid && utils.Int64ToString(token.UserTokenId) == claims.UserTokenId && token.CreatedUnixTime == claims.IssuedAt {
			currentTokenIndex = i
			break
		}
	}

	tokens = append(tokens[:currentTokenIndex], tokens[currentTokenIndex+1:]...)

	err = a.tokens.DeleteTokens(c, uid, tokens)

	if err != nil {
		log.ErrorfWithRequestId(c, "[token.TokenRevokeAllHandler] failed to revoke all tokens for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[token.TokenRevokeAllHandler] user \"uid:%d\" has revoked all tokens", uid)
	return true, nil
}

// TokenRefreshHandler refresh current token of current user
func (a *TokensApi) TokenRefreshHandler(c *core.Context) (any, *errs.Error) {
	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		log.WarnfWithRequestId(c, "[token.TokenRefreshHandler] failed to get user \"uid:%d\" info, because %s", uid, err.Error())
		return nil, errs.ErrUserNotFound
	}

	token, claims, err := a.tokens.CreateToken(c, user)

	if err != nil {
		log.ErrorfWithRequestId(c, "[token.TokenRefreshHandler] failed to create token for user \"uid:%d\", because %s", user.Uid, err.Error())
		return nil, errs.Or(err, errs.ErrTokenGenerating)
	}

	oldTokenClaims := c.GetTokenClaims()
	oldUserTokenId, _ := utils.StringToInt64(oldTokenClaims.UserTokenId)
	oldTokenRecord := &models.TokenRecord{
		Uid:             uid,
		UserTokenId:     oldUserTokenId,
		CreatedUnixTime: oldTokenClaims.IssuedAt,
	}

	c.SetTextualToken(token)
	c.SetTokenClaims(claims)

	log.InfofWithRequestId(c, "[token.TokenRefreshHandler] user \"uid:%d\" token refreshed, new token will be expired at %d", user.Uid, claims.ExpiresAt)

	refreshResp := &models.TokenRefreshResponse{
		NewToken:   token,
		OldTokenId: a.tokens.GenerateTokenId(oldTokenRecord),
		User:       user.ToUserBasicInfo(),
	}

	return refreshResp, nil
}
