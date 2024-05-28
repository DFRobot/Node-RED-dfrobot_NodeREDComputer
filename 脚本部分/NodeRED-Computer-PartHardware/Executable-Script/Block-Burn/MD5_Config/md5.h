/*
 * MD5.h
 *
 *  Created on: 2013-1-29
 *      Author: HouJ
 */
#ifndef MD5_H_
#define MD5_H_
#include <stdint.h>
void MD5(const void* ps,char *output);
extern void md5_md5(const unsigned char* data, uint32_t len,unsigned char * md5Out);
#endif /* MD5_H_ */
